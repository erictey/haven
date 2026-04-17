// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { createPersistedEnvelope, HAVEN_STORAGE_KEY } from './lib/persistedData';
import type { AppData } from './lib/types';

function makeBaseData(overrides: Partial<AppData> = {}): AppData {
  return {
    setupCompleted: true,
    coreValues: [
      {
        id: 'value-1',
        text: 'Integrity',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    missionItems: [
      { id: 'build-1', category: 'build', text: 'Write daily', isActive: true, usedInCurrentRotation: true },
      { id: 'shape-1', category: 'shape', text: 'Tidy desk', isActive: true, usedInCurrentRotation: false },
      { id: 'work-1', category: 'workWith', text: 'Uncertainty', isActive: true, usedInCurrentRotation: false },
      { id: 'build-2', category: 'build', text: 'Practice deeply', isActive: true, usedInCurrentRotation: false },
    ],
    activeCycle: null,
    history: [],
    pendingRecapCycleId: null,
    ...overrides,
  };
}

function seedApp(data: AppData) {
  window.localStorage.clear();
  window.localStorage.setItem(
    HAVEN_STORAGE_KEY,
    JSON.stringify(createPersistedEnvelope(data, '2026-01-10T00:00:00.000Z')),
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

describe('App recap flow', () => {
  it('shows the completed-cycle recap before returning to weekly selection', async () => {
    const user = userEvent.setup();

    seedApp(
      makeBaseData({
        history: [
          {
            id: 'history-1',
            buildItemId: 'build-1',
            shapeItemId: 'shape-1',
            workWithItemId: 'work-1',
            buildText: 'Write daily',
            shapeText: 'Tidy desk',
            workWithText: 'Uncertainty',
            intentions: { build: 'Write daily', shape: 'Keep it clean', workWith: 'Pause' },
            startDate: '2026-01-01T00:00:00.000Z',
            endDate: '2026-01-08T00:00:00.000Z',
            evidence: { build: [], shape: [], workWith: [] },
            reflection: {
              text: 'A steadier week.',
              submittedAt: '2026-01-08T12:00:00.000Z',
            },
          },
        ],
        pendingRecapCycleId: 'history-1',
      }),
    );

    render(<App />);

    expect(screen.getByRole('heading', { name: /your week in review/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /start planning the next week/i }));

    expect(screen.getByRole('heading', { name: /fresh start/i })).toBeInTheDocument();
  });
});

describe('History timeline', () => {
  it('filters history entries by keyword from the new timeline controls', async () => {
    const user = userEvent.setup();

    seedApp(
      makeBaseData({
        history: [
          {
            id: 'history-1',
            buildItemId: 'build-1',
            shapeItemId: 'shape-1',
            workWithItemId: 'work-1',
            buildText: 'Write daily',
            shapeText: 'Tidy desk',
            workWithText: 'Uncertainty',
            intentions: { build: '', shape: '', workWith: '' },
            startDate: '2026-01-01T00:00:00.000Z',
            endDate: '2026-01-08T00:00:00.000Z',
            evidence: { build: [], shape: [], workWith: [] },
            reflection: {
              text: 'I found a better writing rhythm.',
              submittedAt: '2026-01-08T12:00:00.000Z',
            },
          },
          {
            id: 'history-2',
            buildItemId: 'build-2',
            shapeItemId: 'shape-1',
            workWithItemId: 'work-1',
            buildText: 'Practice deeply',
            shapeText: 'Tidy desk',
            workWithText: 'Uncertainty',
            intentions: { build: '', shape: '', workWith: '' },
            startDate: '2026-01-09T00:00:00.000Z',
            endDate: '2026-01-16T00:00:00.000Z',
            evidence: { build: [], shape: [], workWith: [] },
            reflection: {
              text: 'Mostly a reset week.',
              submittedAt: '2026-01-16T12:00:00.000Z',
            },
          },
        ],
      }),
    );

    render(<App />);

    await user.click(screen.getByRole('button', { name: /history/i }));
    await user.type(
      await screen.findByPlaceholderText(/search by week, keyword, or reflection text/i),
      'writing rhythm',
    );

    expect(screen.getByText(/i found a better writing rhythm/i)).toBeInTheDocument();
    expect(screen.queryByText(/mostly a reset week/i)).not.toBeInTheDocument();
  });
});

describe('Dashboard dialog accessibility', () => {
  it('focuses and closes the meaning dialog with the keyboard', async () => {
    const user = userEvent.setup();

    seedApp(
      makeBaseData({
        activeCycle: {
          id: 'cycle-1',
          buildItemId: 'build-1',
          shapeItemId: 'shape-1',
          workWithItemId: 'work-1',
          intentions: { build: 'Write daily', shape: 'Keep it clean', workWith: 'Pause' },
          startDate: '2026-01-09T00:00:00.000Z',
          endDate: '2099-01-16T00:00:00.000Z',
          status: 'active',
          evidence: { build: [], shape: [], workWith: [] },
        },
      }),
    );

    render(<App />);

    await user.click(
      (
        await screen.findAllByRole('button', { name: /open meaning/i }, { timeout: 4000 })
      )[0],
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
