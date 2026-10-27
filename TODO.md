# TODO

## Nature scene and animal reveals
- [x] Present a nature environment as the main interactive scene. When the user makes the sounds of the animals (cat, cow, dog, duck, sheep, owl and pig), the matching animal appears on screen in that scene with its name and a responsive entrance animation.

## Microphone access and listening states
- [x] Require microphone permission for sound recognition. Provide clear microphone permission requests and listening controls, including visible ready, listening, denied and error states.

## Teachable Machine audio recognition
- [x] Use the supplied `tm-my-audio-model.zip` Teachable Machine audio model without substituting another model. Recognize cat, cow, dog, duck, sheep, owl and pig calls; keep Background Noise from revealing an animal, and use confidence handling to reduce accidental detections.

## Recognition feedback and retry
- [x] Show live recognition feedback so users can see the current prediction or listening status. Provide simple instructions and a retry/reset flow for trying another animal call.

## Graceful unsupported and failure states
- [x] Handle unsupported sounds, low-confidence results, unavailable microphones and incompatible browsers gracefully.
