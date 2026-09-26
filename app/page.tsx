export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="text-center space-y-2 mt-8">
          <h1 className="text-4xl font-bold tracking-tight text-blue-300">AI Code Tutor 🧑🏻‍🏫</h1>
          <p className="text-gray-400 text-lg">Paste code you want to understand, not just copy.</p>
        </header>

        {/* Input Section */}
        <section className="space-y-3 shadow-xl p-4 rounded-lg border border-gray-700 bg-gray-800">
          <textarea
            className="w-full h-64 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm resize-y"
            placeholder="Paste your code snippet here..."
          ></textarea>
          <button
            className="w-full bg-blue-800 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
          >
            Teach Me This Code
          </button>
        </section>

        {/* Mock Output Section (Just for Day 2 Visualization) */}
        <section className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl opacity-75">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Analysis & Breakdown (Mockup)</h2>
          <div className="text-gray-300 space-y-4">
            <p>This is a placeholder. Starting on Day 4, the AI's line-by-line explanation will appear exactly here.</p>
            <div className="p-4 bg-gray-900 rounded border border-gray-700 font-mono text-sm text-blue-300">
              // The AI will format your parsed code cleanly like this.
            </div>
            <p>We will use React Markdown to ensure all the bolding, lists, and code blocks render perfectly.</p>
          </div>
        </section>
        
      </div>
    </main>
  );
}