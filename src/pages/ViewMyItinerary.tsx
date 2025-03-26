import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserItineraryViewService, UserItineraryView } from '../services/user-itinerary-view.service';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Calendar } from 'lucide-react';

const ViewMyItinerary: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [itinerary, setItinerary] = useState<UserItineraryView | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDestIndex, setSelectedDestIndex] = useState(0);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);

    const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        };
        return new Date(date).toLocaleDateString('en-US', options);
    };

    useEffect(() => {
        const fetchItinerary = async () => {
            if (id) {
                const { data, error } = await UserItineraryViewService.getItineraryById(id);
                if (data) {
                    setItinerary(data);
                }
                setLoading(false);
            }
        };
        fetchItinerary();
    }, [id]);

    useEffect(() => {
        setSelectedDayIndex(0);
    }, [selectedDestIndex]);

    if (loading) {
        return <div className="container mx-auto px-4 py-8 mt-16">Loading...</div>;
    }

    const selectedDestination = itinerary?.destinations[selectedDestIndex];
    const getDayNumber = (destIndex: number, dayIndex: number) => {
        let totalDays = 1;
        for (let i = 0; i < destIndex; i++) {
            totalDays += (itinerary?.destinations[i]?.nights || 0);
        }
        return totalDays + dayIndex;
    };

    const currentDayNumber = getDayNumber(selectedDestIndex, selectedDayIndex);
    const dayAttractions = itinerary?.day_attractions?.find(d => d.day_index === currentDayNumber)?.attractions;
    const dayHotel = itinerary?.day_hotels?.find(d => d.day_index === currentDayNumber)?.hotel;

    // Mock data for the schedule (replace with actual data from your backend)
    const schedule = [
        { time: "09:00 AM", activity: "Colosseum & Roman Forum", description: "Explore ancient Rome with a guided tour of the iconic Colosseum and Roman Forum." },
        { time: "01:00 PM", activity: "Lunch Break", description: "Enjoy authentic Roman pasta at La Taverna dei Fori Imperiali." },
        { time: "03:00 PM", activity: "Palatine Hill", description: "Visit the centermost of the Seven Hills of Rome with stunning views." },
        { time: "06:00 PM", activity: "Evening Stroll", description: "Walk through Piazza Navona and enjoy the beautiful fountains." }
    ];

    // Mock data for restaurants (replace with actual data from your backend)
    const restaurants = [
        {
            name: "La Pergola",
            cuisine: "Italian Fine Dining",
            knownFor: "Chef Heinz Beck's creative Italian cuisine",
            price: "€€€€"
        },
        {
            name: "Roscioli",
            cuisine: "Traditional Roman",
            knownFor: "Carbonara and Amatriciana pasta",
            price: "€€"
        },
        {
            name: "Pizzarium",
            cuisine: "Pizza",
            knownFor: "Artisanal pizza by the slice",
            price: "€"
        }
    ];

    return (
        <section className="py-12 px-6 bg-stone-50">
            <div className="container mx-auto max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="mb-10"
                >
                    <h1 className="text-[40px] sm:text-[48px] font-light text-stone-800 mb-4 text-center">
                        {itinerary?.trip_name || '10-Day European Adventure'}
                    </h1>
                    <p className="text-xl text-stone-600 mb-8 text-center">An unforgettable journey through Italy, Switzerland, and France.</p>
                    <Link to="/overview" className="text-travel-600 hover:text-travel-700 flex items-center justify-center gap-2 mb-12">
                        ← Back to overview
                    </Link>

                    <h2 className="text-3xl font-light text-stone-800 mb-6">Your {itinerary?.duration || 10}-Day Itinerary</h2>

                    <Tabs
                        value={selectedDestination?.destination}
                        onValueChange={(value: string) => {
                            const index = itinerary?.destinations.findIndex(d => d.destination === value) ?? 0;
                            setSelectedDestIndex(index);
                        }}
                    >
                        <TabsList className="mb-8 flex flex-wrap h-auto bg-transparent p-0 justify-start">
                            {itinerary?.destinations.map((dest, index) => (
                                <TabsTrigger
                                    key={dest.destination}
                                    value={dest.destination}
                                    className="data-[state=active]:bg-travel-100 data-[state=active]:text-travel-800 mr-2 mb-2"
                                >
                                    {dest.destination} ({dest.nights} {dest.nights === 1 ? 'day' : 'days'})
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {itinerary?.destinations.map((destination, destIndex) => (
                            <TabsContent
                                key={destination.destination}
                                value={destination.destination}
                                className="mt-0"
                            >
                                <div className="glass-card p-6 rounded-xl mb-8 bg-white border border-stone-200/50 shadow-sm backdrop-blur-sm">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                                        <div>
                                            <h3 className="text-2xl font-medium text-stone-800">{destination.destination}</h3>
                                            <p className="text-stone-600">Starting July 1, 2023 • {destination.nights} days</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {Array.from({ length: destination.nights }).map((_, dayIndex) => (
                                            <button
                                                key={dayIndex}
                                                onClick={() => setSelectedDayIndex(dayIndex)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${dayIndex === selectedDayIndex
                                                    ? 'bg-travel-600 text-white'
                                                    : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-300'
                                                    }`}
                                            >
                                                Day {getDayNumber(destIndex, dayIndex)}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-8">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 bg-[#EEF2FF] rounded-full flex items-center justify-center text-2xl text-[#6366F1]">
                                                {getDayNumber(destIndex, selectedDayIndex)}
                                            </div>
                                            <div>
                                                <div className="text-[#64748B] text-sm font-medium flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(new Date(itinerary?.start_date || ''))}
                                                </div>
                                                {dayHotel && (
                                                    <div className="flex items-center gap-2 text-[#64748B] text-sm mt-0.5">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                        <span className="font-medium">{dayHotel}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                                            <div className="p-6">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M17.5 8.33334C17.5 14.1667 10 19.1667 10 19.1667C10 19.1667 2.5 14.1667 2.5 8.33334C2.5 6.34421 3.29018 4.43656 4.6967 3.03004C6.10322 1.62352 8.01088 0.833344 10 0.833344C11.9891 0.833344 13.8968 1.62352 15.3033 3.03004C16.7098 4.43656 17.5 6.34421 17.5 8.33334Z" stroke="#0EA5E9" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                                                        <path d="M10 10.8333C11.3807 10.8333 12.5 9.71405 12.5 8.33334C12.5 6.95262 11.3807 5.83334 10 5.83334C8.61929 5.83334 7.5 6.95262 7.5 8.33334C7.5 9.71405 8.61929 10.8333 10 10.8333Z" stroke="#0EA5E9" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    <h3 className="text-[#0F172A] text-lg font-semibold">Things to Do & See</h3>
                                                </div>
                                                <p className="text-[#64748B] text-sm">Scheduled activities for the day</p>
                                            </div>

                                            <div className="divide-y divide-[#E2E8F0]">
                                                {schedule.map((item, index) => (
                                                    <div key={index} className="p-6 flex items-start gap-6">
                                                        <div className="flex items-center gap-2 min-w-[80px]">
                                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M8 5.33333V8L9.33333 9.33333M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                            <span className="text-[#94A3B8] text-sm">{item.time}</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[#0F172A] text-base font-medium">{item.activity}</h4>
                                                            <p className="text-[#64748B] text-sm mt-1">{item.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Food & Dining Options Section */}
                                        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden mt-8">
                                            <div className="p-6">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M6.66667 1.66666V4.16666M13.3333 1.66666V4.16666M2.5 17.5V6.66666C2.5 5.74619 3.24619 5 4.16667 5H15.8333C16.7538 5 17.5 5.74619 17.5 6.66666V17.5M2.5 17.5C2.5 18.4205 3.24619 19.1667 4.16667 19.1667H15.8333C16.7538 19.1667 17.5 18.4205 17.5 17.5M2.5 17.5V10.8333C2.5 9.91286 3.24619 9.16666 4.16667 9.16666H15.8333C16.7538 9.16666 17.5 9.91286 17.5 10.8333V17.5" stroke="#F59E0B" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    <h3 className="text-[#0F172A] text-lg font-semibold">Food & Dining Options</h3>
                                                </div>
                                                <p className="text-[#64748B] text-sm">Recommended restaurants and eateries</p>
                                            </div>

                                            <div className="px-6">
                                                <div className="grid grid-cols-[2fr,1.5fr,2.5fr,0.75fr] text-[#64748B] text-sm font-medium">
                                                    <div className="pb-2">Restaurant</div>
                                                    <div className="pb-2">Cuisine</div>
                                                    <div className="pb-2">Known For</div>
                                                    <div className="pb-2">Price</div>
                                                </div>

                                                <div className="divide-y divide-[#E2E8F0]">
                                                    {restaurants.map((restaurant, index) => (
                                                        <div key={index} className="grid grid-cols-[2fr,1.5fr,2.5fr,0.75fr] py-4">
                                                            <div className="text-[#0F172A] text-sm font-medium">{restaurant.name}</div>
                                                            <div className="text-[#64748B] text-sm">{restaurant.cuisine}</div>
                                                            <div className="text-[#64748B] text-sm">{restaurant.knownFor}</div>
                                                            <div className="text-[#0F172A] text-sm font-medium">{restaurant.price}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notes Section */}
                                        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden mt-8">
                                            <div className="p-6">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M6.66667 5H13.3333M6.66667 9.16667H13.3333M6.66667 13.3333H10M17.5 9.16667V14.1667C17.5 15.0871 17.5 15.5474 17.3183 15.9081C17.1586 16.2293 16.8959 16.4919 16.5748 16.6517C16.214 16.8333 15.7537 16.8333 14.8333 16.8333H5.16667C4.24619 16.8333 3.78595 16.8333 3.42515 16.6517C3.10398 16.4919 2.84135 16.2293 2.68162 15.9081C2.5 15.5474 2.5 15.0871 2.5 14.1667V5.83333C2.5 4.91286 2.5 4.45262 2.68162 4.09182C2.84135 3.77065 3.10398 3.50802 3.42515 3.34829C3.78595 3.16667 4.24619 3.16667 5.16667 3.16667H14.8333C15.7537 3.16667 16.214 3.16667 16.5748 3.34829C16.8959 3.50802 17.1586 3.77065 17.3183 4.09182C17.5 4.45262 17.5 4.91286 17.5 5.83333V9.16667Z" stroke="#3B82F6" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    <h3 className="text-[#0F172A] text-lg font-semibold">Notes</h3>
                                                </div>
                                                <p className="text-[#64748B] text-sm mt-4">Remember to bring comfortable walking shoes as Rome is best explored on foot. Many attractions require modest dress (covered shoulders and knees).</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </motion.div>
            </div>
        </section>
    );
};

export default ViewMyItinerary; 