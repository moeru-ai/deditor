# umap-wasm

This package provides a WebAssembly implementation of UMAP and approximate nearest neighbor search.

The UMAP implementation is [umappp](https://github.com/libscran/umappp/) by Aaron Lun.

The approximate nearest neighbor search is based on [knncolle](https://github.com/knncolle/knncolle), with two algorithms, including HNSW ([hnswlib](https://github.com/nmslib/hnswlib)) and [nndescent](https://github.com/brj0/nndescent) by Jon Brugger.

## Documentation

See `index.d.ts` for the full API.

To initialize the algorithm, use `createUMAP`:

```js
import { createUMAP } from "umap-wasm";

let count = 2000;
let input_dim = 100;
let output_dim = 2;

// The data must be a Float32Array with count * input_dim elements.
let data = new Float32Array(count * input_dim);
// ... fill in the data

let options = {
  metric: "cosine",
};

// Use `createUMAP` to initialize the algorithm.
let umap = await createUMAP(count, input_dim, output_dim, data, options);
```

After initialization, use the `run` method to update the embedding coordinates:

```js
// Run the algorithm to completion.
umap.run();

// Alternatively, you can run up to a given number of epochs.
// This can be useful for animation effects.
for (let i = 0; i < 100; i++) {
  // Run to the i-th epoch.
  umap.run(i);
}
```

At any time, you can get the current embedding by calling the `embedding` method.

```js
// The result is a Float32Array with count * output_dim elements.
let embedding = umap.embedding();
```

After you are done with the instance, use the `destroy` method to release resources.

```js
umap.destroy();
```

## Development

A pre-compiled WASM file is included in the Git repository. If you'd like to build this package, proceed with the following instructions:

First, install [Emscripten](https://emscripten.org/).
The WASM module is built with the Emscripten toolchain.

Download all necessary dependencies with the following commands:

```bash
cd third_party
./download_dependencies.sh
```

Note that you don't need to build any of these packages.

Finally, you may run:

```bash
make
```

to build the WASM module. The output file should be `runtime.js`.
