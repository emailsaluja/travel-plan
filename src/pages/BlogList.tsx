import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, MessageCircle } from 'lucide-react';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: 'tips' | 'guides' | 'stories';
    featured_image_url: string;
    reading_time_minutes: number;
    comment_count: number;
    is_editors_pick: boolean;
    published_at: string;
}

const BlogList = () => {
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'tips' | 'guides' | 'stories'>('all');

    useEffect(() => {
        const fetchBlogPosts = async () => {
            try {
                let query = supabase
                    .from('blog_posts')
                    .select('*')
                    .order('published_at', { ascending: false });

                if (selectedCategory !== 'all') {
                    query = query.eq('category', selectedCategory);
                }

                const { data, error } = await query;

                if (error) throw error;
                setBlogPosts(data || []);
            } catch (error) {
                console.error('Error fetching blog posts:', error);
                setError('Failed to load blog posts');
            } finally {
                setLoading(false);
            }
        };

        fetchBlogPosts();
    }, [selectedCategory]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00C48C] border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Blog Posts</h1>
                    <p className="text-gray-600">There was a problem loading the blog posts. Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Travel Blog</h1>
                    <p className="text-xl text-gray-600">Discover travel tips, guides, and stories from around the world</p>
                </div>

                {/* Category Filter */}
                <div className="flex justify-center gap-4 mb-12">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === 'all'
                            ? 'bg-[#00C48C] text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        All Posts
                    </button>
                    <button
                        onClick={() => setSelectedCategory('tips')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === 'tips'
                            ? 'bg-[#00C48C] text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Travel Tips
                    </button>
                    <button
                        onClick={() => setSelectedCategory('guides')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === 'guides'
                            ? 'bg-[#00C48C] text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Travel Guides
                    </button>
                    <button
                        onClick={() => setSelectedCategory('stories')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === 'stories'
                            ? 'bg-[#00C48C] text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Travel Stories
                    </button>
                </div>

                {/* Blog Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogPosts.map((post) => (
                        <Link
                            key={post.id}
                            to={`/blog/${post.slug}`}
                            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                            <div className="relative h-48">
                                <img
                                    src={post.featured_image_url}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 bg-[#4B83FB] text-white text-sm font-medium rounded-full">
                                        {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                                    {post.title}
                                </h2>
                                <p className="text-gray-600 mb-4 line-clamp-3">
                                    {post.excerpt}
                                </p>
                                <div className="flex items-center gap-6 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(post.published_at)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {post.reading_time_minutes} min read
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MessageCircle className="w-4 h-4" />
                                        {post.comment_count} comments
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BlogList; 