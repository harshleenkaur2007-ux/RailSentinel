RailSentinel is an AI-powered autonomous command layer concept designed to monitor a national rail network in real time. It aims to detect disasters before they escalate, simulate autonomous train rerouting, manage crush-level crowd safety, and orchestrate emergency response within seconds a massive optimization over legacy manual chains.

Architecture Note: This repository contains the Frontend Client Application for the RailSentinel platform. For evaluation and integration testing, the client currently operates in a standalone mode, utilizing simulated data streams to visualize the command-center interface. Full production deployment requires integration with the RailSentinel Core API.

Platform Capabilities:

SentinelWatch Live Map: A high-performance rail radar layout tracking active corridors (e.g., the Mumbai-Pune track) with pulsing anomaly indicators and real-time fleet telemetry.

The Centaur Model Interface: Engineered for safety-critical environments, balancing autonomous speed with human oversight via "Approve/Override" controller workflows and auto-escalation protocols.

Cascade Rerouter: Renders graph-based routing alternatives to bypass localized incidents, dynamically calculating delay offsets and risk factors to prevent network-wide cascade paralysis.

CrowdGuard Metrics: A station-level dashboard executing real-time CCTV crowd density analysis and triggering automated public address (PA) systems to prevent stampedes.

Emergency Console: A live-updating event log tracking historical decision sequences, dispatch actions, and multi-agency communication ETAs.

