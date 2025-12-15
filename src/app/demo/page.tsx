'use client';

import { useState } from 'react';

interface Player {
  id: string;
  name: string;
  chips: number;
  position: number;
  cards?: [string, string];
  bet: number;
  folded: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  isTurn: boolean;
}

interface GameState {
  tableId: string;
  players: Player[];
  communityCards: string[];
  pot: number;
  currentBet: number;
  phase: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  turnTimer: number;
  winner?: { playerId: string; hand: string; amount: number };
}

// Position coordinates for up to 8 players around the table - positioned OUTSIDE the table
const PLAYER_POSITIONS: Record<number, { top?: string; bottom?: string; left?: string; right?: string; transform?: string }> = {
  0: { bottom: '-5%', left: '50%', transform: 'translateX(-50%)' },
  1: { bottom: '5%', left: '-5%' },
  2: { top: '50%', left: '-8%', transform: 'translateY(-50%)' },
  3: { top: '5%', left: '-5%' },
  4: { top: '-5%', left: '50%', transform: 'translateX(-50%)' },
  5: { top: '5%', right: '-5%' },
  6: { top: '50%', right: '-8%', transform: 'translateY(-50%)' },
  7: { bottom: '5%', right: '-5%' },
};

const MOCK_GAME_STATE: GameState = {
  tableId: 'demo-table',
  players: [
    {
      id: 'me',
      name: 'You',
      chips: 950,
      position: 0,
      cards: ['A♠', 'K♥'],
      bet: 50,
      folded: false,
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: false,
      isTurn: true,
    },
    {
      id: 'player2',
      name: 'Mike',
      chips: 1200,
      position: 2,
      cards: ['Q♣', 'Q♦'],
      bet: 100,
      folded: false,
      isDealer: true,
      isSmallBlind: false,
      isBigBlind: false,
      isTurn: false,
    },
    {
      id: 'player3',
      name: 'Sarah',
      chips: 800,
      position: 4,
      cards: ['J♠', '10♠'],
      bet: 25,
      folded: false,
      isDealer: false,
      isSmallBlind: true,
      isBigBlind: false,
      isTurn: false,
    },
    {
      id: 'player4',
      name: 'John',
      chips: 450,
      position: 6,
      cards: ['8♥', '8♣'],
      bet: 50,
      folded: false,
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: true,
      isTurn: false,
    },
    {
      id: 'player5',
      name: 'Emma',
      chips: 0,
      position: 5,
      cards: ['2♦', '7♣'],
      bet: 0,
      folded: true,
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: false,
      isTurn: false,
    },
  ],
  communityCards: ['10♥', 'J♦', 'Q♠'],
  pot: 225,
  currentBet: 100,
  phase: 'flop',
  turnTimer: 23,
};

function PlayingCard({ card, faceDown = false, small = false }: { card: string; faceDown?: boolean; small?: boolean }) {
  const isRed = card.includes('♥') || card.includes('♦');

  if (faceDown) {
    return (
      <div className={`${small ? 'w-10 h-14' : 'w-14 h-20'} rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 border border-blue-700 shadow-lg relative overflow-hidden`}>
        <div className="absolute inset-1 rounded border border-blue-600/30">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)`
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${small ? 'w-10 h-14' : 'w-14 h-20'} rounded-lg bg-gradient-to-br from-white to-gray-100 border border-gray-200 shadow-lg flex items-center justify-center relative`}>
      <div className="absolute inset-0.5 rounded border border-gray-200/50" />
      <span className={`${small ? 'text-sm' : 'text-lg'} font-bold ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        {card}
      </span>
    </div>
  );
}

function PlayerSeat({ player, isHero, showCards }: { player: Player; isHero: boolean; showCards: boolean }) {
  const position = PLAYER_POSITIONS[player.position] || {};

  return (
    <div
      className="absolute flex flex-col items-center gap-2"
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        right: position.right,
        transform: position.transform,
      }}
    >
      {/* Cards */}
      {player.cards && !player.folded && (
        <div className="flex gap-1 mb-1">
          {player.cards.map((card, i) => (
            <PlayingCard
              key={i}
              card={card}
              faceDown={!isHero && !showCards}
              small={!isHero}
            />
          ))}
        </div>
      )}

      {/* Player info card */}
      <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
        player.isTurn
          ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-transparent shadow-lg shadow-amber-400/30'
          : player.folded
            ? 'opacity-50'
            : ''
      }`}>
        <div className={`px-4 py-3 min-w-[120px] ${
          player.isTurn
            ? 'bg-gradient-to-br from-amber-500 to-amber-600'
            : player.folded
              ? 'bg-neutral-800'
              : isHero
                ? 'bg-gradient-to-br from-green-600 to-green-700'
                : 'bg-gradient-to-br from-neutral-700 to-neutral-800'
        }`}>
          {/* Badges */}
          <div className="flex items-center justify-center gap-1 mb-1">
            {player.isDealer && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-neutral-900 rounded">D</span>
            )}
            {player.isSmallBlind && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded">SB</span>
            )}
            {player.isBigBlind && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">BB</span>
            )}
          </div>

          <div className={`font-semibold text-center truncate ${
            player.isTurn ? 'text-neutral-900' : 'text-white'
          }`}>
            {player.name}
          </div>

          <div className={`text-sm text-center ${
            player.isTurn ? 'text-neutral-800' : 'text-neutral-300'
          }`}>
            ${player.chips.toLocaleString()}
          </div>
        </div>

        {/* Bet indicator */}
        {player.bet > 0 && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 bg-neutral-900/90 rounded-full border border-amber-500/30">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300" />
            <span className="text-xs font-medium text-amber-400">${player.bet}</span>
          </div>
        )}
      </div>

      {/* Turn timer */}
      {player.isTurn && (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-amber-400 text-xs font-mono bg-neutral-900/80 px-2 py-1 rounded-full">
          23s
        </div>
      )}
    </div>
  );
}

export default function DemoPage() {
  const [gameState, setGameState] = useState<GameState>(MOCK_GAME_STATE);
  const [betAmount, setBetAmount] = useState(100);

  const currentPlayer = gameState.players.find((p) => p.id === 'me');
  const isMyTurn = currentPlayer?.isTurn ?? false;

  const handleAction = (action: string, amount?: number) => {
    console.log(`Demo action: ${action} ${amount || ''}`);

    if (action === 'fold') {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p =>
          p.id === 'me' ? { ...p, folded: true, isTurn: false } : p
        )
      }));
    } else if (action === 'call') {
      const callAmount = gameState.currentBet - (currentPlayer?.bet ?? 0);
      setGameState(prev => ({
        ...prev,
        pot: prev.pot + callAmount,
        players: prev.players.map(p =>
          p.id === 'me'
            ? { ...p, chips: p.chips - callAmount, bet: prev.currentBet, isTurn: false }
            : p.id === 'player2' ? { ...p, isTurn: true } : p
        )
      }));
    }
  };

  const resetDemo = () => {
    setGameState(MOCK_GAME_STATE);
  };

  const advancePhase = () => {
    setGameState(prev => {
      const phases: GameState['phase'][] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
      const currentIndex = phases.indexOf(prev.phase);
      const nextPhase = phases[(currentIndex + 1) % phases.length];

      let newCommunityCards = prev.communityCards;
      if (nextPhase === 'flop') newCommunityCards = ['10♥', 'J♦', 'Q♠'];
      else if (nextPhase === 'turn') newCommunityCards = ['10♥', 'J♦', 'Q♠', 'K♣'];
      else if (nextPhase === 'river') newCommunityCards = ['10♥', 'J♦', 'Q♠', 'K♣', 'A♦'];
      else if (nextPhase === 'preflop') newCommunityCards = [];

      return {
        ...prev,
        phase: nextPhase,
        communityCards: newCommunityCards,
        winner: nextPhase === 'showdown' ? { playerId: 'me', hand: 'Broadway Straight!', amount: prev.pot } : undefined,
      };
    });
  };

  const minBet = gameState.currentBet;
  const maxBet = currentPlayer?.chips || 0;
  const callAmount = gameState.currentBet - (currentPlayer?.bet ?? 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/10 via-transparent to-neutral-950/50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-green-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-20 bg-[#0a0a0a]/80 backdrop-blur-sm border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a
              href="/lobby"
              className="flex items-center gap-2 px-4 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Lobby
            </a>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <span className="text-amber-400 text-sm font-medium">Demo Mode</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={resetDemo}
              className="px-4 py-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all text-sm"
            >
              Reset
            </button>
            <button
              onClick={advancePhase}
              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 rounded-lg transition-all text-sm"
            >
              Next Phase
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20 rounded-lg">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-300" />
              <span className="font-bold text-amber-400">${currentPlayer?.chips?.toLocaleString() ?? 0}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 relative z-10">
        <div className="relative w-full max-w-6xl aspect-[16/10]">
          {/* Poker Table */}
          <div className="absolute inset-[18%] sm:inset-[20%]">
            {/* Table outer ring (wood) */}
            <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-amber-800 to-amber-950 shadow-2xl" />

            {/* Table rail */}
            <div className="absolute inset-2 rounded-[50%] bg-gradient-to-b from-amber-900 to-amber-950 border-4 border-amber-700/50" />

            {/* Felt surface */}
            <div className="absolute inset-4 rounded-[50%] bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 shadow-inner overflow-hidden">
              {/* Felt texture */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
              }} />

              {/* Center line decoration */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full border border-emerald-600/30" />
            </div>

            {/* Center content */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
              {/* Pot display */}
              <div className="mb-4">
                <div className="text-emerald-300/70 text-xs uppercase tracking-widest mb-1">Total Pot</div>
                <div className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                  ${gameState.pot.toLocaleString()}
                </div>
              </div>

              {/* Phase indicator */}
              <div className="text-emerald-300/50 text-xs uppercase tracking-widest mb-4">
                {gameState.phase}
              </div>

              {/* Community Cards */}
              {gameState.communityCards.length > 0 && (
                <div className="flex gap-2 sm:gap-3 justify-center">
                  {gameState.communityCards.map((card, i) => (
                    <PlayingCard key={i} card={card} />
                  ))}
                  {/* Empty card slots */}
                  {Array.from({ length: 5 - gameState.communityCards.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-14 h-20 rounded-lg border-2 border-dashed border-emerald-600/30" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Players */}
          {gameState.players.map((player) => (
            <PlayerSeat
              key={player.id}
              player={player}
              isHero={player.id === 'me'}
              showCards={gameState.phase === 'showdown'}
            />
          ))}

          {/* Winner announcement */}
          {gameState.winner && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
              <div className="bg-neutral-900/95 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-8 text-center shadow-2xl shadow-amber-500/20">
                <div className="text-amber-400 text-sm uppercase tracking-widest mb-2">Winner</div>
                <div className="text-2xl font-bold text-white mb-1">
                  {gameState.players.find((p) => p.id === gameState.winner?.playerId)?.name}
                </div>
                <div className="text-neutral-400 text-sm mb-4">{gameState.winner.hand}</div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
                  <span className="text-green-400 text-xl font-bold">+${gameState.winner.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Panel */}
      {isMyTurn && gameState.phase !== 'waiting' && gameState.phase !== 'showdown' && (
        <div className="relative z-20 bg-[#0a0a0a]/95 backdrop-blur-sm border-t border-neutral-800/50">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Fold */}
              <button
                onClick={() => handleAction('fold')}
                className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 font-semibold rounded-xl transition-all"
              >
                Fold
              </button>

              {/* Check/Call */}
              {gameState.currentBet === currentPlayer?.bet ? (
                <button
                  onClick={() => handleAction('check')}
                  className="px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 font-semibold rounded-xl transition-all"
                >
                  Check
                </button>
              ) : (
                <button
                  onClick={() => handleAction('call')}
                  className="px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 font-semibold rounded-xl transition-all"
                >
                  Call ${callAmount}
                </button>
              )}

              {/* Bet/Raise slider */}
              <div className="flex-1 flex items-center gap-4 px-4 py-2 bg-neutral-800/50 rounded-xl">
                <input
                  type="range"
                  min={minBet}
                  max={maxBet}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-sm">$</span>
                  <input
                    type="number"
                    min={minBet}
                    max={maxBet}
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.min(maxBet, Math.max(minBet, Number(e.target.value))))}
                    className="w-20 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-center focus:outline-none focus:border-green-500/50"
                  />
                </div>
              </div>

              {/* Bet/Raise */}
              <button
                onClick={() => handleAction(gameState.currentBet > 0 ? 'raise' : 'bet', betAmount)}
                disabled={betAmount <= gameState.currentBet}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-neutral-700 disabled:to-neutral-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/30 disabled:shadow-none"
              >
                {gameState.currentBet > 0 ? `Raise to $${betAmount}` : `Bet $${betAmount}`}
              </button>
            </div>

            {/* Quick bet buttons */}
            <div className="flex justify-center gap-2 mt-3">
              {[0.5, 0.75, 1, 2].map((multiplier) => {
                const amount = Math.min(Math.floor(gameState.pot * multiplier), maxBet);
                if (amount <= minBet) return null;
                return (
                  <button
                    key={multiplier}
                    onClick={() => setBetAmount(amount)}
                    className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-800/50 hover:bg-neutral-700 rounded-lg transition-all"
                  >
                    {multiplier === 1 ? 'Pot' : `${multiplier * 100}%`}
                  </button>
                );
              })}
              <button
                onClick={() => setBetAmount(maxBet)}
                className="px-3 py-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-all"
              >
                All-In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info text when not your turn */}
      {!isMyTurn && gameState.phase !== 'showdown' && (
        <div className="relative z-20 bg-[#0a0a0a]/80 border-t border-neutral-800/50">
          <div className="max-w-3xl mx-auto px-4 py-4 text-center">
            <div className="text-neutral-500">
              {gameState.players.find(p => p.id === 'me')?.folded
                ? 'You folded this hand'
                : <>
                    Waiting for{' '}
                    <span className="text-amber-400 font-medium">
                      {gameState.players.find(p => p.isTurn)?.name}
                    </span>
                    {' '}to act...
                  </>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
