## Staking
#### Need to know before:
**bias** — amount of reserved Rari/stRari.

**slope** — the rate of bias decrease, amount of Rari/stRari by which bias will decrease per unit of time equal to one week.

**cliff** — period in weeks, when bias value constant.

**Lock** — stake object with a unique id that is defined by parameters **bias**, **slope**, **cliff**, **timeStart**.

**broken line** — the sum of all Locks, represented as a curve of the amount Rari/stRari over time.
### About
Staking contract - designed to reserve users **Rari** to the account of a smart contract.
Instead of **Rari**, the user is awarded **stRary** points, the sum of which determines 
the user's weight when voting for community decisions.

#### Creating Lock

The **Lock** life mechanism with the specified parameters (**bias**, **slope**, **cliff**) is visually displayed along the timeline 
as a **broken line**. The user decides what type of line to choose and which parameters to set. When creating a **Lock**,
**Rari** equal to the bias parameter transferred to the contract account. Depending on the parameters, **cliff** and **slope**
**Lock** can be of 3 types:
only cliff,
cliff plus slope,
only slope.
For example, consider picture 1.

![Staking 1](documents/svg/Pict1StakeMethods.svg)

When creating the **Lock**, amount **stRary** will be calculated using a special formula, but the form
the line will be similar to the **Rary** line, consider picture 2. 

![Staking 1](documents/svg/Pict2RariStrariLines.svg)

If the user uses line type with cliff only, then the mechanism no withdraw **Rary** provided until the end time of **Lock**.
When **slope** works, some amount of **Rary** can be withdraw back to the user, as shown in picture 3.

![Staking 1](documents/svg/Pict3Withdraw.svg)

The user can create an unlimited number of **Lock**.
Each **Lock** created has a unique *id*. Moreover, with each creation
**Lock** increases the amount **Rari** and the amount **stRari**. Mechanism for changing any amount
Lock for **Rari** and similar **stRari** is visually displayed using **broken line**, consider picure 4.

![Staking 2](documents/svg/Pict4BrokenLine.svg)

#### Modernize Lock

For each created **Lock**, user can execute the *restake* method, which allows you to overwrite the new **Lock** parameters.
The following parameters are available for changing: **bias**, **cliff**, **slope**, as shown in picture 5. It is important, 
that the **Lock** completion time during *restake* is not less than the initial **Lock** period, otherwise *restake* will fail. 

![Staking 2](documents/svg/Pict5ReStakingNoTransfer.svg)

If the *withdraw* operation performed before the *restake*, or when the *restake* increases the bias 
to a high degree, then part of the missing **Rari** will be automatically transferred from the user to the contract, as shown in picture 6.

![Staking 2](documents/svg/Pict6ReStakingTransfer.svg)

#### stRari calculate

Amount **stRari** is calculated by the formula:

stRari = k * Rari. 

K = (0.07 + 0.93 * (cliffPeriod / 104) ^ 2 + 0.5 * (0.07 + 0.93 * (slopePeriod / 104) ^ 2)) * 1000.

Amount **stRari** depends on the values of period cliff and period slope. The longer the stake period, the more **stRari** 
the user will receive. Max staking period equal 2 years cliff period and 2 years slope period. 
The K coefficient changes non-linearly, as shown in the picture 7. 

![Staking 2](documents/svg/Pict7GgraphicK.svg)
