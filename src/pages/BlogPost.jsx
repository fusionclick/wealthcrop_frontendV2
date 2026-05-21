// src/pages/BlogPost.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { blogData as staticBlogData } from "../data/blogData";
import { FiShare2 } from "react-icons/fi";

const API_ENDPOINT = ""; // same endpoint as list if available

const estimateReadTime = (text = "") => {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
};

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(Boolean(API_ENDPOINT));

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(Boolean(API_ENDPOINT));
      if (API_ENDPOINT) {
        try {
          const res = await fetch(API_ENDPOINT);
          const data = await res.json();
          if (!mounted) return;
          const posts = Array.isArray(data) ? data : data.posts || [];
          setAllPosts(posts);
          setPost(posts.find((p) => String(p.id) === String(id)));
        } catch (e) {
          console.error(e);
          setAllPosts(staticBlogData);
          setPost(staticBlogData.find((p) => String(p.id) === String(id)));
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        setAllPosts(staticBlogData);
        setPost(staticBlogData.find((p) => String(p.id) === String(id)));
        setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [id]);

  if (loading) return <div className="p-10">Loading...</div>;
  if (!post) return <div className="p-10">Post not found. <button onClick={() => navigate(-1)} className="text-indigo-600">Go back</button></div>;

  const related = allPosts.filter((p) => p.category === post.category && p.id !== post.id).slice(0, 3);

  const share = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: post.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  return (
      <div
      className="
        min-h-screen py-10 px-4
        bg-linear-to-r from-blue-100 to-green-100
        dark:from-[var(--app-bg)] dark:to-[var(--app-bg)]
      "
    >
      <div
        className="
          max-w-5xl mx-auto rounded-2xl shadow overflow-hidden
          bg-white
          dark:bg-[var(--card-bg)]
          dark:border dark:border-[var(--border-color)]
        "
      >
        {/* COVER IMAGE */}
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-72 object-cover"
        />

        <div className="p-6">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="text-xs text-indigo-600 font-semibold">
                {post.category}
              </p>

              <h1
                className="
                  text-3xl font-bold mt-2
                  text-gray-900
                  dark:text-[var(--text-primary)]
                "
              >
                {post.title}
              </h1>

              <div
                className="
                  text-sm mt-2
                  text-gray-500
                  dark:text-[var(--text-secondary)]
                "
              >
                {new Date(post.date).toLocaleDateString()} •{" "}
                {estimateReadTime(post.content)}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2">
              <button
                onClick={share}
                className="
                  px-3 py-2 rounded-md flex items-center gap-2
                  bg-indigo-600 text-white
                  hover:bg-indigo-700 transition
                "
              >
                <FiShare2 /> Share
              </button>

              <Link
                to="/blogs"
                className="
                  px-3 py-2 rounded-md border
                  text-gray-700
                  bg-white
                  dark:bg-[var(--gray-800)]
                  dark:border-[var(--border-color)]
                  dark:text-[var(--text-secondary)]
                "
              >
                Back
              </Link>
            </div>
          </div>

          {/* CONTENT */}
          <article
            className="
              prose max-w-none mt-6
              text-gray-700
              dark:text-[var(--text-secondary)]
            "
          >
            <p>{post.content}</p>
          </article>

          {/* RELATED POSTS */}
          {related.length > 0 && (
            <div className="mt-10">
              <h3
                className="
                  text-xl font-semibold mb-4
                  text-gray-900
                  dark:text-[var(--text-primary)]
                "
              >
                Related posts
              </h3>

              <div className="grid sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to={`/blog/${r.id}`}
                    className="
                      rounded-lg p-3 shadow
                      bg-white
                      dark:bg-[var(--gray-800)]
                      dark:border dark:border-[var(--border-color)]
                    "
                  >
                    <img
                      src={r.image}
                      alt={r.title}
                      className="h-28 w-full object-cover rounded"
                    />

                    <h4
                      className="
                        text-sm font-semibold mt-2
                        text-gray-900
                        dark:text-[var(--text-primary)]
                      "
                    >
                      {r.title}
                    </h4>

                    <p
                      className="
                        text-xs mt-1
                        text-gray-500
                        dark:text-[var(--text-secondary)]
                      "
                    >
                      {new Date(r.date).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
