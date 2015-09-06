# Hexagonal Ants

A continuation of https://github.com/jcorbin/ants , now on hexagons.

# UI

Beyond click to play/pause, UI is currently keyboard and URL-fragment driven
only:

## Keyboard controls

- `<Space>` -- single step when paused
- `+` -- double frame rate
- `-` -- half frame rate
- `*` -- dump the data tree to console.log for debugging
- `#` -- toggle labels for debugging

## URL-fragment (hash) variables

- frameRate -- number of animation ticks attempted per second
- drawUnvisited -- specify to draw every cell in the tree instead of only
  visited ones
- labeled -- specify to add coordinate labels to cells (doesn't scale well,
  only for debugging)

# Running

Just:
```
$ npm install
$ npm run serve
```

## MIT Licensed