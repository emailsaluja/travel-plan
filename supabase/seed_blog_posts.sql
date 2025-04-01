-- Insert dummy blog posts
INSERT INTO blog_posts (
    user_id,
    title,
    slug,
    content,
    excerpt,
    category,
    featured_image_url,
    reading_time_minutes,
    comment_count,
    is_featured,
    is_editors_pick,
    published_at
) VALUES
-- Featured story about slow travel
(
    'your-user-id-here', -- Replace with your actual user ID
    'A Year of Slow Travel: What I Learned Living Like a Local',
    'year-of-slow-travel',
    'After a transformative year of slow travel across Europe and Asia, I''ve discovered that the true essence of travel isn''t about checking off bucket list items or racing through tourist attractions. It''s about immersing yourself in the local culture, forming meaningful connections, and allowing yourself to truly experience each destination.

Living like a local in different cities has taught me invaluable lessons about adaptation, cultural sensitivity, and the beauty of everyday moments. From morning markets in Bangkok to afternoon aperitivos in Rome, these simple daily routines became the highlight of my journey.',
    'After spending a full year living in different cities around the world, I''ve gained insights into how slow travel can transform your experience and connection with a place.',
    'stories',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2048&auto=format&fit=crop',
    15,
    32,
    true,
    true,
    NOW() - INTERVAL '2 days'
),

-- Guide about hidden Paris spots
(
    'your-user-id-here', -- Replace with your actual user ID
    'Hidden Gems of Paris: Beyond the Tourist Trail',
    'hidden-gems-paris',
    'While the Eiffel Tower and Louvre are must-sees, the true magic of Paris lies in its lesser-known corners. After living in the City of Light for six months, I''ve discovered enchanting spots that most tourists never see.

From the hidden passages of the 2nd arrondissement to the artistic havens of the 13th, each neighborhood holds its own secrets. Here''s your guide to experiencing Paris like a true Parisian.',
    'Discover the lesser-known spots that most tourists miss in the City of Light, from hidden cafes to secret gardens.',
    'guides',
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000&auto=format&fit=crop',
    8,
    24,
    false,
    false,
    NOW() - INTERVAL '5 days'
),

-- Budget travel tips
(
    'your-user-id-here', -- Replace with your actual user ID
    'Budget Travel: Europe on $50/day',
    'europe-budget-travel',
    'Think exploring Europe is expensive? Think again! I''ve managed to travel through 5 countries while spending just $50 per day on average. Here''s my comprehensive guide to budget-friendly European travel.

From finding affordable accommodation to eating well without breaking the bank, I''ll share all my money-saving strategies that don''t compromise the travel experience.',
    'How I explored 5 European countries without breaking the bank - a complete guide to budget travel in Europe.',
    'tips',
    'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?q=80&w=1000&auto=format&fit=crop',
    12,
    37,
    false,
    false,
    NOW() - INTERVAL '7 days'
),

-- Solo female travel tips
(
    'your-user-id-here', -- Replace with your actual user ID
    'Solo Female Travel: Safety Tips & Empowering Experiences',
    'solo-female-travel-guide',
    'Traveling solo as a woman can be one of the most empowering experiences. After visiting 30+ countries alone, I''ve learned valuable lessons about staying safe while having incredible adventures.

From practical safety tips to building confidence and handling cultural differences, this guide covers everything you need to know about solo female travel.',
    'Essential advice for women traveling alone based on my experience across 30+ countries.',
    'tips',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop',
    10,
    45,
    false,
    true,
    NOW() - INTERVAL '10 days'
),

-- Cultural experience story
(
    'your-user-id-here', -- Replace with your actual user ID
    'Living with Nomads: My Month in Mongolia',
    'month-with-mongolian-nomads',
    'Spending a month with Mongolian nomads in the Gobi Desert changed my perspective on life, happiness, and what we really need to thrive. From learning to milk mares to helping with the seasonal migration.

This immersive experience taught me about sustainable living, community values, and the incredible hospitality of nomadic cultures.',
    'An unforgettable month living with nomadic families in the Gobi Desert, experiencing their traditional way of life.',
    'stories',
    'https://images.unsplash.com/photo-1536599424071-0b215a388ba7?q=80&w=1000&auto=format&fit=crop',
    18,
    29,
    false,
    false,
    NOW() - INTERVAL '15 days'
),

-- Photography guide
(
    'your-user-id-here', -- Replace with your actual user ID
    'Travel Photography: Capturing the Perfect Moment',
    'travel-photography-guide',
    'Great travel photography isn''t just about having the right gear – it''s about telling stories through your images. In this comprehensive guide, I''ll share techniques I''ve learned over years of documenting my travels.

From camera settings to composition tips, post-processing workflows, and the art of capturing authentic moments.',
    'Learn how to take stunning travel photos that tell compelling stories, regardless of your camera type.',
    'guides',
    'https://images.unsplash.com/photo-1452796907770-ad6cd374b12d?q=80&w=1000&auto=format&fit=crop',
    14,
    41,
    false,
    false,
    NOW() - INTERVAL '20 days'
); 