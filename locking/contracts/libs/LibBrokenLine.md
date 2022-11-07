## BrokenLine

This library is inspired by curve.fi locking contract. It's a bit more generalized, added some new features and can be used independently of any locking logic.

It can be used to model linearly declining values.

Library solves this problem: we have some linear functions, which are specified using these params:
- start - x coordinate where line starts
- bias - y coordinate where line starts
- slope - angle of slope of the line (multiplied by -1)
- cliff - interval when y is constant

These lines end when y falls to zero. Here you can see example line:

![Locking 2](../../documents/svg/line.svg)

Library allows to sum any amount of such lines and calculate value y without iterating over these lines. Only small amount of state changes are required to update broken line.

### Functions implemented:

- add - adds one more line to the broken line, lines should have unique ids
- remove - removes line from the broken line
- update - refreshes broken line up to current time - this operation can make many state changes but it can be done in some transactions

NOTE: update can only be done for future. It's impossible to get previous value of the broken line.