import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

const BlogPost = () => {
    const { slug } = useParams<{ slug: string }>();
    const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBlogPost = async () => {
            try {
                const { data, error } = await supabase
                    .from('blog_posts')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (error) throw error;
                setBlogPost(data);
            } catch (error) {
                console.error('Error fetching blog post:', error);
                setError('Failed to load blog post');
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchBlogPost();
        }
    }, [slug]);

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

    if (error || !blogPost) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Blog Post Not Found</h1>
                    <p className="text-gray-600">The blog post you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA]">
            {/* Hero Section */}
            <div className="relative h-[400px] bg-gray-900">
                <img
                    src={blogPost.featured_image_url}
                    alt={blogPost.title}
                    className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 max-w-4xl mx-auto">
                    <div className="text-[#4B83FB] text-sm font-semibold mb-2">
                        {blogPost.category.charAt(0).toUpperCase() + blogPost.category.slice(1)}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-medium text-white mb-4">
                        {blogPost.title}
                    </h1>
                    <div className="flex items-center gap-6 text-white/80 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(blogPost.published_at)}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {blogPost.reading_time_minutes} min read
                        </div>
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            {blogPost.comment_count} comments
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="prose prose-lg max-w-none">
                    {blogPost.content.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-6 text-[#1e293b] text-lg leading-relaxed">
                            {paragraph}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BlogPost; 