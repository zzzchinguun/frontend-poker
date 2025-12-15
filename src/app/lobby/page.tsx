'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface PokerTable {
  id: string;
  name: string;
  small_blind: number;
  big_blind: number;
  max_players: number;
  current_players: number;
}

const BLIND_OPTIONS = [
  { small: 1, big: 2, label: 'Micro' },
  { small: 5, big: 10, label: 'Low' },
  { small: 10, big: 20, label: 'Medium' },
  { small: 25, big: 50, label: 'High' },
];

export default function LobbyPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [tables, setTables] = useState<PokerTable[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);

  // Create table modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [selectedBlinds, setSelectedBlinds] = useState(0);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchTables = async () => {
      const { data, error } = await supabase
        .from('poker_tables')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTables(data);
      }
      setLoadingTables(false);
    };

    fetchTables();

    const channel = supabase
      .channel('poker_tables_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poker_tables' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTables((prev) => [payload.new as PokerTable, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTables((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as PokerTable) : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setTables((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleJoinTable = (tableId: string) => {
    router.push(`/game/${tableId}`);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);

    const blinds = BLIND_OPTIONS[selectedBlinds];

    const { data, error } = await supabase
      .from('poker_tables')
      .insert({
        name: newTableName,
        small_blind: blinds.small,
        big_blind: blinds.big,
        max_players: maxPlayers,
        current_players: 0,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      setCreateError(error.message);
      setCreating(false);
    } else {
      setShowCreateModal(false);
      setNewTableName('');
      setCreating(false);
      router.push(`/game/${data.id}`);
    }
  };

  const getTableStatus = (table: PokerTable) => {
    if (table.current_players >= table.max_players) return 'full';
    if (table.current_players >= 2) return 'active';
    return 'waiting';
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center animate-pulse">
            <span className="text-2xl">♠</span>
          </div>
          <div className="text-neutral-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/20 via-transparent to-amber-950/10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-neutral-800/50 bg-[#0a0a0a]/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                  <span className="text-xl">♠</span>
                </div>
                <span className="text-xl font-bold text-white">PokerRoom</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neutral-800/50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-neutral-300">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 py-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Game Lobby</h1>
              <p className="text-neutral-500">Join a table or create your own</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Table
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Active Tables', value: tables.filter(t => t.current_players >= 2).length, icon: '♠' },
              { label: 'Players Online', value: tables.reduce((acc, t) => acc + t.current_players, 0), icon: '♦' },
              { label: 'Available Seats', value: tables.reduce((acc, t) => acc + (t.max_players - t.current_players), 0), icon: '♣' },
              { label: 'Your Balance', value: '$1,000', icon: '♥' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#141414] border border-neutral-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                  <span className={i % 2 === 0 ? 'text-neutral-400' : 'text-red-400'}>{stat.icon}</span>
                  {stat.label}
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Tables Section */}
          <div className="bg-[#141414] border border-neutral-800/50 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-800/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Available Tables</h2>
              <a href="/demo" className="text-neutral-600 hover:text-neutral-400 text-xs transition-colors">
                Demo Mode
              </a>
            </div>

            {loadingTables ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mb-4" />
                <div className="text-neutral-500">Loading tables...</div>
              </div>
            ) : tables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                <div className="w-16 h-16 rounded-2xl bg-neutral-800/50 flex items-center justify-center mb-4">
                  <span className="text-3xl text-neutral-600">♠</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No Tables Available</h3>
                <p className="text-neutral-500 text-center mb-6">Be the first to create a table and start playing!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors"
                >
                  Create First Table
                </button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/50">
                {tables.map((table) => {
                  const status = getTableStatus(table);
                  return (
                    <div
                      key={table.id}
                      className="flex items-center justify-between p-5 hover:bg-neutral-800/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Table icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          status === 'active' ? 'bg-green-500/10 text-green-500' :
                          status === 'full' ? 'bg-red-500/10 text-red-400' :
                          'bg-neutral-800 text-neutral-500'
                        }`}>
                          <span className="text-xl">♠</span>
                        </div>

                        <div>
                          <h3 className="text-white font-medium mb-0.5">{table.name}</h3>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-neutral-500">
                              ${table.small_blind}/${table.big_blind}
                            </span>
                            <span className="text-neutral-700">•</span>
                            <span className={`${
                              status === 'active' ? 'text-green-500' :
                              status === 'full' ? 'text-red-400' :
                              'text-amber-500'
                            }`}>
                              {status === 'active' ? 'In Progress' :
                               status === 'full' ? 'Full' : 'Waiting'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Player count */}
                        <div className="hidden sm:flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {Array.from({ length: Math.min(table.current_players, 3) }).map((_, i) => (
                              <div key={i} className="w-8 h-8 rounded-full bg-neutral-700 border-2 border-[#141414] flex items-center justify-center">
                                <span className="text-xs text-neutral-400">P{i + 1}</span>
                              </div>
                            ))}
                            {table.current_players > 3 && (
                              <div className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-[#141414] flex items-center justify-center">
                                <span className="text-xs text-neutral-400">+{table.current_players - 3}</span>
                              </div>
                            )}
                          </div>
                          <span className="text-neutral-400 text-sm">
                            {table.current_players}/{table.max_players}
                          </span>
                        </div>

                        {/* Join button */}
                        <button
                          onClick={() => handleJoinTable(table.id)}
                          disabled={table.current_players >= table.max_players}
                          className={`px-5 py-2.5 font-medium rounded-xl transition-all ${
                            table.current_players >= table.max_players
                              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/30'
                          }`}
                        >
                          {table.current_players >= table.max_players ? 'Full' : 'Join'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Table Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-[#141414] rounded-2xl w-full max-w-lg border border-neutral-800/50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-neutral-800/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Create New Table</h2>
                <p className="text-neutral-500 text-sm mt-0.5">Set up your poker table</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="p-6 space-y-6">
              {/* Table Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Table Name
                </label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  required
                  maxLength={30}
                  className="w-full px-4 py-3.5 bg-[#0d0d0d] border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
                  placeholder="My Poker Table"
                />
              </div>

              {/* Blinds Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Blind Level
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {BLIND_OPTIONS.map((blind, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedBlinds(index)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedBlinds === index
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-neutral-800 bg-[#0d0d0d] hover:border-neutral-700'
                      }`}
                    >
                      <div className={`text-lg font-bold ${selectedBlinds === index ? 'text-green-500' : 'text-white'}`}>
                        ${blind.small}/${blind.big}
                      </div>
                      <div className="text-sm text-neutral-500">{blind.label} Stakes</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Players */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Max Players
                </label>
                <div className="flex gap-3">
                  {[2, 4, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setMaxPlayers(num)}
                      className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                        maxPlayers === num
                          ? 'bg-green-500 text-white'
                          : 'bg-[#0d0d0d] border border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {createError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3">
                  <span className="text-red-500 mt-0.5">⚠</span>
                  <span>{createError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTableName.trim()}
                  className="flex-1 px-4 py-3.5 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-neutral-700 disabled:to-neutral-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 disabled:shadow-none"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </span>
                  ) : 'Create & Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
