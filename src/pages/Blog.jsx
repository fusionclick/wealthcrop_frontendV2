// src/pages/BlogPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
import { blogData as staticBlogData } from "../data/blogData";
import { highlightText } from "../utils/highlight";

const API_ENDPOINT = ""; // keep empty to use static

const categories = [
  "All",
  "Wealth Tips",
  "Mutual Funds",
  "Personal Finance",
  "Retirement",
  "Tax Saving",
];

const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-md p-4 animate-pulse">
    <div className="h-44 bg-gray-200 rounded-lg"></div>
    <div className="mt-4 h-4 bg-gray-200 rounded w-1/3"></div>
    <div className="mt-2 h-3 bg-gray-200 rounded w-2/3"></div>
    <div className="mt-2 h-3 bg-gray-200 rounded w-1/2"></div>
  </div>
);

const Blog = () => {
  const navigate = useNavigate();

  // MAIN STATES
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(Boolean(API_ENDPOINT));
  const [error, setError] = useState(null);

  // FILTER & SEARCH
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  /** -------------------------
   * LOAD POSTS (API / STATIC)
   * ------------------------- */
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(Boolean(API_ENDPOINT));
      setError(null);

      try {
        if (API_ENDPOINT) {
          const res = await fetch(API_ENDPOINT);
          if (!res.ok) throw new Error("API error: " + res.status);

          const data = await res.json();
          if (!mounted) return;

          setAllPosts(Array.isArray(data) ? data : data.posts || []);
        } else {
          setAllPosts(staticBlogData);
        }
      } catch (err) {
        console.error(err);
        setError("Couldn't fetch blogs. Using local demo data.");
        setAllPosts(staticBlogData);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
  }, []);

  /** -------------------------
   * SEARCH + CATEGORY FILTER
   * ------------------------- */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allPosts.filter((p) => {
      const catMatch =
        activeCategory === "All" ? true : p.category === activeCategory;

      const searchMatch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.content && p.content.toLowerCase().includes(q));

      return catMatch && searchMatch;
    });
  }, [allPosts, activeCategory, searchQuery]);

  
  /** -------------------------
   * PAGINATION LOGIC
   * ------------------------- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / postsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages]);

  const iLast = currentPage * postsPerPage;
  const iFirst = iLast - postsPerPage;
  const currentPosts = filtered.slice(iFirst, iLast);

  const goToPage = (p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  
  /** Highlight Function */
  const renderHighlighted = (text) => ({
    __html: highlightText(text, searchQuery),
  });

  /** -------------------------
   * RENDER UI
   * ------------------------- */

  return (
      <div
      className="
        min-h-screen py-10 px-4
        bg-gradient-to-br from-blue-100 to-green-100
        dark:from-[var(--app-bg)] dark:to-[var(--app-bg)] 
      "
    >
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-8 text-center">
          <h1 className="
            text-4xl font-extrabold
            text-gray-900
            dark:text-[var(--text-primary)]
          ">
            WealthCrop Blog
          </h1>

          <p className="
            mt-2 max-w-2xl mx-auto
            text-gray-600
            dark:text-[var(--text-secondary)]
          ">
            Insights, wealth tips, mutual fund strategies, tax hacks & investing guides.
          </p>

          {/* SEARCH */}
          <div className="mt-6 flex justify-center">
            <div className="relative w-full max-w-xl">
              <FiSearch className="absolute left-4 top-4 text-gray-400" size={18} />

              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  goToPage(1);
                }}
                placeholder="Search SIP, PPF, Tax, FD, Retirement..."
                className="
                  w-full pl-10 pr-4 py-3 rounded-full outline-none
                  bg-white border border-gray-200 shadow-sm
                  focus:ring-2 focus:ring-indigo-200

                  dark:bg-[var(--card-bg)]
                  dark:border-[var(--border-color)]
                  dark:text-[var(--text-primary)]
                  dark:placeholder:text-[var(--text-secondary)]
                "
              />
            </div>
          </div>
        </div>

        {/* CATEGORY BUTTONS */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                goToPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                activeCategory === cat
                  ? "bg-indigo-600 text-white shadow-md"
                  : `
                    bg-white border text-gray-700
                    dark:bg-[var(--gray-800)]
                    dark:border-[var(--border-color)]
                    dark:text-[var(--text-secondary)]
                  `
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 dark:text-[var(--text-secondary)]">
            Loading articles...
          </div>
        ) : (
          <>
            {filtered.length === 0 ? (
              <div className="py-20 text-center text-gray-500 dark:text-[var(--text-secondary)]">
                No matching articles.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {currentPosts.map((post) => (
                  <article
                    key={post.id}
                    className="
                      rounded-2xl shadow-md overflow-hidden
                      bg-white
                      dark:bg-[var(--card-bg)]
                      dark:border dark:border-[var(--border-color)]
                    "
                  >
                    <Link to={`/blog/${post.id}`}>
                      <img
                        src={post.image}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-56 object-cover"
                      />
                    </Link>

                    <div className="p-5">
                      <p className="text-xs text-indigo-600 font-semibold">
                        {post.category}
                      </p>

                      <h2
                        className="
                          text-lg font-bold mt-1
                          text-gray-900
                          dark:text-[var(--text-primary)]
                        "
                        dangerouslySetInnerHTML={renderHighlighted(post.title)}
                      />

                      <p
                        className="
                          mt-2 text-sm
                          text-gray-600
                          dark:text-[var(--text-secondary)]
                        "
                        dangerouslySetInnerHTML={renderHighlighted(
                          post.description || post.content || ""
                        )}
                      />

                      <div className="
                        mt-3 flex justify-between text-xs
                        text-gray-400
                        dark:text-[var(--text-secondary)]
                      ">
                        <span>{new Date(post.date).toLocaleDateString()}</span>

                        <button
                          onClick={() => navigate(`/blog/${post.id}`)}
                          className="text-indigo-600 font-semibold"
                        >
                          Read more →
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* PAGINATION */}
            {filtered.length > 0 && (
              <div className="flex justify-center items-center gap-3 mt-10">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-md border
                    dark:border-[var(--border-color)]
                    dark:text-[var(--text-secondary)]
                  "
                >
                  <FiChevronLeft />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === page
                          ? "bg-indigo-600 text-white"
                          : `
                            bg-white border
                            dark:bg-[var(--gray-800)]
                            dark:border-[var(--border-color)]
                            dark:text-[var(--text-secondary)]
                          `
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-md border
                    dark:border-[var(--border-color)]
                    dark:text-[var(--text-secondary)]
                  "
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}

        {error && (
          <p className="mt-6 text-center text-red-500 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default Blog;
