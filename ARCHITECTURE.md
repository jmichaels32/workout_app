# End Goal Architecture

The long-term product is a workout system that estimates where a user currently lives in a latent physical-performance space, compares that to a desired goal state, and recommends training interventions that reduce the gap.

## Core Concepts

- **Physical basis:** the latent space of human physical ability. A user's current body/performance state is a point in this space.
- **Goal embedding:** the desired target point or region in that same space. This could come from explicit goals, archetypes, or eventually athlete comparisons.
- **User embedding:** the app's current estimate of the user's physical state, updated from logged observations over time.
- **Delta:** the difference between the user's current embedding and goal embedding.
- **Wind field:** the user's local adaptability at their current point. It captures recovery, fatigue, genetics, training history, diet, sleep, injury risk, motivation, and other factors that affect how easily they can move in a given direction.
- **Uncertainty:** the app's confidence range around the estimated user state and adaptability.

## Information Flow

```text
workout observations
  -> update user embedding + uncertainty
  -> compare against goal embedding
  -> estimate useful training direction
  -> choose movement/load/volume/rest targets
  -> observe next workout result
  -> repeat
```

## Model Responsibilities

1. **State estimator**
   Estimate what the user can currently do from noisy logs.

2. **Movement model**
   Represent each movement as a measurement vector, adaptation vector, cost vector, and risk/skill profile.

3. **Policy / recommender**
   Choose the next useful training stimulus based on user state, goal delta, wind field, uncertainty, and constraints.

## MVP Direction

The MVP should not try to solve the full architecture. It should collect clean observations with minimal friction:

```text
movement name
lbs
reps
optional RIR
date
row order
set timestamp
```

The first useful model can be simple:

```text
For each movement, estimate current performance from history and suggest the next small overload.
```

The long-term architecture can be layered on top once logging is fast and users are producing reliable data.
