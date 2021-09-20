# Benchmarks

Use this scripts to benchmark the payload decoding rate.  

It will send payload from 1000 different devices.

```bash
node benchmark/benchmark.js
```

A script will not send more than 1000 req/s. Run parallel scripts to test more requests.

```bash
node benchmark/benchmark.js &
node benchmark/benchmark.js &
node benchmark/benchmark.js &
node benchmark/benchmark.js &
```

### Results

On Manjaro Linux with 4 CPU 2.40 GHz & 16 Go RAM: 800 req/s