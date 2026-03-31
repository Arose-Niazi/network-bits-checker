# Network Error Detection Calculator

A modern, step-by-step network error detection calculator supporting CRC (Cyclic Redundancy Check), Checksum, and Hamming Code methods.

**Live:** [nc.arose-niazi.me/network/](https://nc.arose-niazi.me/network/)

Part of the [NC Suite](https://nc.arose-niazi.me/).

## Features

- **CRC (Cyclic Redundancy Check)** — Polynomial division with step-by-step XOR operations
- **Checksum** — Binary checksum with 1's complement and wraparound carry
- **Hamming Code** — Encode data with parity bits or decode/detect/correct errors

### General
- Step-by-step visualization of every operation
- Color-coded binary display (data bits, parity bits, CRC bits, check bits)
- **Error injection** — flip bits interactively and detect/correct errors
- Dark/light theme
- Shareable links via URL parameters
- Calculation history (localStorage)
- Print-friendly output
- Responsive design
- Full SEO (meta tags, Open Graph, JSON-LD, sitemap)
- Docker-ready (nginx)

## Tech

Vanilla HTML/CSS/JS — no dependencies, no build step. Pure bitwise operations.

## Docker

```bash
docker compose up -d
```

## License

MIT
