import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, MapPin, Calendar, Tag, ArrowUpDown, PlusCircle, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PsgLogo from '../components/PsgLogo';

export default function FindPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [colour, setColour] = useState('All');
  const [sort, setSort] = useState('newest');

  const categories = [
    'All',
    'Mobile',
    'Laptop',
    'Wallet',
    'ID Card',
    'Keys',
    'Bag',
    'Books',
    'Electronics',
    'Accessories',
    'Other',
  ];

  const colours = ['All', 'Black', 'Blue', 'Silver', 'White', 'Brown', 'Red', 'Green', 'Gold'];

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (category && category !== 'All') params.append('category', category);
      if (location.trim()) params.append('location', location.trim());
      if (date) params.append('date', date);
      if (colour && colour !== 'All') params.append('colour', colour);
      if (sort) params.append('sort', sort);

      const res = await api.get(`/found-items?${params.toString()}`);
      setItems(res.data.items || []);
    } catch (err) {
      console.error('Failed to search found items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category, sort, date, colour]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setLocation('');
    setDate('');
    setColour('All');
    setSort('newest');
    setSearchParams({});
    setTimeout(() => {
      fetchItems();
    }, 50);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* PSG Institutional Search Header */}
      <div className="bg-psg-navy rounded-3xl p-6 sm:p-10 text-white shadow-2xl border border-blue-900/60 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-psg-gold">
              PSG TECH • CAMPUS DIRECTORY
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight font-['Outfit']">
              Search Found Belongings
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium">
              Search all items uploaded by finders, students, staff, and campus security.
            </p>
          </div>

          <Link
            to="/report-lost"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-psg-gold hover:bg-amber-400 text-psg-navy font-extrabold text-xs shadow-lg transition-all self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-psg-navy" />
            <span>REPORT LOST ITEM</span>
          </Link>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-psg-blue absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by item name, brand, location, colour, roll number..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-psg-navy placeholder-slate-400 text-sm font-semibold focus:ring-4 focus:ring-psg-blue/30 outline-none transition"
            />
          </div>
          <button
            type="submit"
            className="py-3.5 px-8 rounded-2xl bg-psg-blue hover:bg-psg-royal text-white font-extrabold text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>SEARCH</span>
          </button>
        </form>

        {/* Category Chips Filter Carousel */}
        <div className="space-y-2.5 pt-3 border-t border-blue-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-psg-gold">
              Filter Category:
            </span>
            {(search || category !== 'All' || location || date || colour !== 'All') && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-psg-gold hover:underline font-bold"
              >
                Clear all filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  category === cat
                    ? 'bg-psg-gold text-psg-navy shadow-md font-extrabold'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          
          {/* Location filter (Manual text input) */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex-1 sm:flex-initial min-w-[150px]">
            <MapPin className="w-3.5 h-3.5 text-psg-blue flex-shrink-0" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchItems()}
              placeholder="Filter location..."
              className="bg-transparent text-slate-700 outline-none text-xs w-full font-medium"
            />
          </div>

          {/* Date filter */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex-1 sm:flex-initial min-w-[130px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              type="date"
              max={new Date().toLocaleDateString('en-CA')}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-slate-700 outline-none text-xs cursor-pointer w-full font-medium"
            />
          </div>

          {/* Colour filter */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex-1 sm:flex-initial min-w-[120px]">
            <Tag className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={colour}
              onChange={(e) => setColour(e.target.value)}
              className="bg-transparent text-slate-700 outline-none text-xs cursor-pointer w-full font-medium"
            >
              {colours.map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All Colours' : c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchItems}
            className="px-4 py-2 rounded-xl bg-psg-navy text-white hover:bg-slate-900 font-bold text-xs transition"
          >
            Apply Filters
          </button>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs self-end sm:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-slate-500 font-bold whitespace-nowrap">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-psg-navy font-bold outline-none cursor-pointer text-xs"
          >
            <option value="newest">Newest Uploads</option>
            {isAuthenticated && <option value="match">Highest Match %</option>}
            <option value="date_closest">Found Date</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-semibold">
        <span>
          Showing <strong className="text-psg-navy">{items.length}</strong> {items.length === 1 ? 'found item' : 'found items'}
        </span>
        {category !== 'All' && (
          <span>Category: <strong className="text-psg-blue">{category}</strong></span>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-psg-navy mx-auto"></div>
          <p className="text-slate-500 text-xs font-semibold mt-3">Searching directory...</p>
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-md max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-psg-navy text-psg-gold flex items-center justify-center mx-auto shadow">
            <Search className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-psg-navy font-['Outfit']">No matching items found</h3>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto font-medium">
              We couldn't find a matching item right now. Submit a lost report and PSG Quick Finder will automatically alert you when a match appears!
            </p>
          </div>
          <Link
            to="/report-lost"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-psg-blue hover:bg-psg-royal text-white font-extrabold text-xs shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4 text-psg-gold" />
            <span>REPORT THIS LOST ITEM</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => {
            const hasPhoto = item.images && item.images.length > 0;
            const photoUrl = hasPhoto ? item.images[0] : null;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-2xl hover:border-psg-blue transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Photo Header */}
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={item.item_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <Search className="w-8 h-8 stroke-[1.5]" />
                      <span className="text-xs font-semibold mt-1">Photo Not Available</span>
                    </div>
                  )}

                  {/* Category badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-psg-navy/90 text-psg-gold shadow-sm">
                      {item.category}
                    </span>
                  </div>

                  {/* Match Score Badge */}
                  {item.matchScore ? (
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wide shadow-md flex items-center gap-1 ${
                        item.matchScore >= 80
                          ? 'bg-emerald-600 text-white animate-pulse'
                          : 'bg-psg-gold text-psg-navy'
                      }`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        Match: {item.matchScore}%
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-psg-navy text-base group-hover:text-psg-blue transition-colors line-clamp-1">
                      {item.item_name}
                    </h3>

                    {/* Location & Specs */}
                    <div className="space-y-1 text-xs text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-psg-blue flex-shrink-0" />
                        <span className="truncate">Found at: <strong>{item.found_location}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>Date: <strong>{item.found_date}</strong></span>
                      </div>
                      {item.colour && (
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>Colour: <strong>{item.colour}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Badge & Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      item.status === 'Claimed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'Claim Requested'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-50 text-psg-blue'
                    }`}>
                      {item.status}
                    </span>

                    <Link
                      to={`/items/${item.id}`}
                      className="px-4 py-2 rounded-xl bg-psg-navy hover:bg-slate-900 text-white text-xs font-bold shadow-sm transition-all"
                    >
                      VIEW DETAILS
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
