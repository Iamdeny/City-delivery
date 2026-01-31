/**
 * Главная поисковая строка в стиле Самоката
 */
'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MainSearchBar() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 mb-4">
      <div className="relative">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Искать в Самокате"
          className="w-full h-[44px] pl-12 pr-4 bg-[#f2f2f2] border-0 rounded-xl text-base font-normal text-[#1a1a1a] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:bg-white transition-all"
          style={{
            fontFamily: 'Inter, Avenir, Helvetica, Arial, sans-serif',
          }}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      </div>
    </form>
  );
}
