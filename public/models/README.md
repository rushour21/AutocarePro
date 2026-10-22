# Optional 3D vehicle models

The 3D workshop draws a built-in stylised car for every vehicle. To use your own licensed `.glb` models instead,
put the files in `public/models/cars/` and list them in `manifest.json`:

```json
{
  "cars": {
    "bmw3": { "url": "/models/cars/bmw3.glb" },
    "audiq5": { "url": "/models/cars/suv.glb", "rotY": 180, "scale": 1.0 }
  }
}
```

* Keys are the vehicle picture keys used by the app: `bmw3`, `audiq5`, `glc`, `fortuner`, `bmwx5`, `rangerover`.
* Models are centred, sat on the floor and scaled so their length matches a real car (about 4.7 m).
  Point the front of the model along +Z; use `rotY` (degrees) if it faces another way and `scale` to fine-tune.
* Missing or broken files fall back to the built-in car, so a bad entry never breaks the dashboard.
* Keep each file small (ideally under 2 MB): reduce polygons and texture sizes, and compress with Draco or Meshopt.
* Check the licence of every model before shipping it in a product.
