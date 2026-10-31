#!/usr/bin/env python3
"""Compatibility entrypoint: rebuild from the complete current ElevenLabs take.

The former clause-splicing pipeline used timestamps from an older script.
All current source timings live in sync_source.py.
"""
from sync_source import main

if __name__ == "__main__":
    main()
