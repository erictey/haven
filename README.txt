================================================================================
HAVEN — Weekly Mission & Identity Tracker
================================================================================
Version: 0.1.0
Author:  EricTey
Contact: erictey00@gmail.com

OVERVIEW
--------
Haven is a desktop app (Electron + React) for weekly intentional living.
Each cycle you select one mission from three categories — Build, Shape,
Work With — set intentions, log evidence, and reflect at week's end.
Data stays local; no cloud sync, no accounts.

CORE CONCEPTS
-------------
  Core Values    — personal anchors defined during first-time setup
  Mission Items  — ongoing tasks/goals organized into 3 categories:
                     Build     : things you are constructing or creating
                     Shape     : habits or skills you are refining
                     Work With : relationships or collaborators to nurture
  Active Cycle   — one item per category, runs for one week
  Evidence       — text notes or images logged during the cycle
  Reflection     — end-of-cycle review written before the cycle closes
  History        — read-only archive of all completed cycles

SCREENS
-------
  Setup      — first-run wizard: enter core values & first mission items
  Selection  — pick one item per category to start a new cycle
  Dashboard  — active cycle view: countdown, evidence columns, messages
  Reflection — submit end-of-cycle reflection
  History    — browse past cycles and evidence
  About      — app info

DATA STORAGE
------------
All data is stored locally via Electron's userData directory.
No data is transmitted externally.

LICENSE
-------
Private / proprietary. All rights reserved.
================================================================================
