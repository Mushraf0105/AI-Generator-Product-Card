/**
 * App.jsx
 * Main React Component for the AI Product Card Generator
 * Handles UI state, form submissions, image blob fetching, and API requests to Google Gemini
 */
import React, { useState } from 'react';
import { Sparkles, Loader2, Tag, Info, ShoppingBag, ShoppingCart } from 'lucide-react';

export default function App() {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [productDetails, setProductDetails] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);


  // Fetches product details from Google Gemini based on user input
  const generateDetails = async (e) => {
    e.preventDefault();
    if (!productName.trim() || !category.trim()) {
      setError('Please provide both a product name and category.');
      return;
    }

    setLoading(true);
    setError('');
    setImageUrl(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API key is missing. Please set VITE_GEMINI_API_KEY in your .env file.");
      }

      const prompt = `You are an expert copywriter. Generate product card details for a product named "${productName}" in the category "${category}".
Return ONLY a valid JSON object with the following structure:
{
  "title": "A catchy title for the product card",
  "description": "A short, engaging description (max 2 sentences)",
  "price": "A realistic suggested price string in Indian Rupees (e.g., '₹1999')",
  "imagePrompt": "A highly detailed, beautiful product photography prompt describing this item on a clean background (e.g., 'professional studio lighting, elegant quantum sneakers, high fashion, 4k')",
  "keywords": ["tag1", "tag2", "tag3"]
}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to fetch from AI service');
      }

      const data = await response.json();
      const textResponse = data.candidates[0].content.parts[0].text;
      const parsedData = JSON.parse(textResponse);
      setProductDetails(parsedData);

      // We do NOT set imageUrl immediately. This keeps the "Generating photo..." spinner visible.
      const imgPrompt = parsedData.imagePrompt || productName + ' product photography';
      const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?width=800&height=600&nologo=true`;

      // We load the image using the native Image object to avoid CORS issues!
      // This also lets us wait for it to load before hiding the "Generating photo..." spinner.
      const img = new Image();
      img.onload = () => {
        setImageUrl(imgUrl);
      };
      img.onerror = () => {
        console.error('Primary AI image failed, using fallback');
        // If AI fails, fallback to a clean text placeholder
        const text = encodeURIComponent(parsedData.title || productName);
        setImageUrl(`https://placehold.co/800x600/1e293b/a78bfa?text=${text}`);
      };
      img.src = imgUrl;

      setProductName('');
      setCategory('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while generating details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-slate-100 flex items-center justify-center p-6 w-full">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

        {/* Form Section */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center gap-3">
              <Sparkles className="text-purple-400" />
              AI Product Gen
            </h1>
            <p className="text-slate-400 mt-2 text-sm">Create compelling product cards in seconds using AI.</p>
          </div>

          <form onSubmit={generateDetails} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Product Name</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Quantum Glide Sneakers"
                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Footwear / Athletics"
                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-600"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <Info className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Card...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Details
                </>
              )}
            </button>
          </form>
        </div>

        {/* Preview Section */}
        <div className="flex items-center justify-center md:h-full">
          {loading ? (
            // Skeleton Loader State
            <div className="w-full bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 animate-pulse">
              <div className="h-64 bg-slate-700/50"></div>
              <div className="p-6 space-y-4 bg-slate-900">
                <div className="space-y-3">
                  <div className="h-8 bg-slate-700/50 rounded-md w-3/4"></div>
                  <div className="h-4 bg-slate-700/50 rounded-md w-full"></div>
                  <div className="h-4 bg-slate-700/50 rounded-md w-5/6"></div>
                </div>
                <div className="pt-4 flex gap-2">
                  <div className="h-6 bg-slate-700/50 rounded-full w-16"></div>
                  <div className="h-6 bg-slate-700/50 rounded-full w-20"></div>
                </div>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <div className="h-6 bg-slate-700/50 rounded-md w-16"></div>
                  <div className="h-10 bg-slate-700/50 rounded-lg w-28"></div>
                </div>
              </div>
            </div>
          ) : productDetails ? (
            // Success Product Card
            <div
              className="w-full bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 group hover:border-purple-500/50 transition-all duration-500 relative"
            >

              <div className="h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center relative overflow-hidden group">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={productDetails.title}
                    onError={(e) => {
                      const text = encodeURIComponent(productDetails.title || 'Product');
                      e.target.src = `https://placehold.co/800x600/1e293b/a78bfa?text=${text}`;
                      e.target.onerror = null;
                    }}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 space-y-2">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    <span className="text-xs">Generating photo...</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
              </div>
              <div className="p-6 space-y-4 bg-slate-900 relative z-10">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-100">{productDetails.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    {productDetails.description}
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  {productDetails.keywords?.map((keyword, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full text-xs font-medium flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      {keyword}
                    </span>
                  ))}
                </div>

                <div className="pt-6 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xl font-bold text-emerald-400">
                    {productDetails.price || "₹1999"}
                  </div>
                  <button className="bg-white text-slate-900 hover:bg-slate-200 font-semibold py-2 px-5 rounded-lg text-sm flex items-center gap-2 transition-colors shadow-lg">
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Default Empty State
            <div className="w-full aspect-[3/4] max-h-[500px] border-2 border-dashed border-slate-700/50 hover:border-slate-600 rounded-2xl flex flex-col items-center justify-center text-slate-500 space-y-4 p-8 text-center bg-slate-900/20 transition-all duration-300">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center ring-1 ring-slate-700/50">
                <ShoppingBag className="w-8 h-8 text-slate-600" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-slate-400">Ready to Generate</p>
                <p className="text-sm">Enter details on the left to preview your product card</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}