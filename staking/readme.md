## Staking

This contract is based on [LibBrokenLine](../broken-line/readme.md).

This contract locks ERC-20 tokens and issues back staked tokens. These staked tokens are not transferrable, but they can be delegated to other users. Tokens unlock linearly. 

![Line](../broken-line/documents/line.svg)

User locks tokens on `start` moment, amount of locked tokens is `bias`. In `cliff` period amount of locked tokens doesn't change, then it starts to decline linearly. 

Staked balance behaves pretty the same way, but initial `bias` is multiplied by multiplier calculated using `Stake` parameters (slope, cliff, bias etc.) 

### Features

Functions supported for every user:
 - stake - create new `Stake`. Initial bias of the `Stake` depends on locked token amount and other parameters of the `Stake` (cliff, period etc.)
 - reStake - change parameters of the `Stake`. It's possible to extend period and increase locked amount
 - withdraw - withdraw unlocked ERC-20 tokens (if something is unlocked already)
 - delegateTo - delegates specific `Stake` to other user
 - split - TBD

### Functions to read the data
 - totalSupply - calculates sum of all staked balances
 - balanceOf(address) - calculates current power for specified user (sums all his Stakes and all delegated Stakes)
 


-----------------------------------------------------

#### Creating Lock

The **Lock** life mechanism with the specified parameters (**bias**, **slope**, **cliff**) is visually displayed along the timeline 
as a **broken line**. The user decides what type of line to choose and which parameters to set. When creating a **Lock**,
**Rari** equal to the **bias** parameter transferred to the contract account. Depending on the parameters, **cliff** and **slope**
**Lock** can be of 3 types:
- only cliff,
- cliff plus slope,
- only slope.

For example, consider picture 1.

![Staking 1](documents/svg/Pict1StakeMethods.svg)

When creating the **Lock**, amount **stRary** will be calculated using a special formula, but the form
the line will be similar to the **Rary** line, consider picture 2. 

![Staking 2](documents/svg/Pict2RariStrariLines.svg)

If the user uses line type with cliff only, then the mechanism no withdraw **Rary** provided until the end time of **Lock**.
When **slope** works, some amount of **Rary** can be withdraw back to the user, as shown in picture 3.

![Staking 3](documents/svg/Pict3Withdraw.svg)

The user can create an unlimited number of **Lock**.
Each **Lock** created has a unique *id*. Moreover, with each creation
**Lock** increases the amount **Rari** and the amount **stRari**. Mechanism for changing Lock amount
for **Rari** and similar **stRari** is visually displayed using **broken line**, consider picure 4.

![Staking 4](documents/svg/Pict4BrokenLine.svg)

#### Modernize Lock

For each created **Lock**, user can execute the *restake* method, which allows you to overwrite the new **Lock** parameters.
The following parameters are available for changing: **bias**, **cliff**, **slope**, as shown in picture 5. It is important, 
that the **Lock** completion time during *restake* is not less than the initial **Lock** period, otherwise *restake* will fail. 

![Staking 5](documents/svg/Pict5ReStakingNoTransfer.svg)

If the *withdraw* operation performed before the *restake*, or when the *restake* increases the bias 
to a high degree, then part of the missing **Rari** will be automatically transferred from the user to the contract, as shown in picture 6.

![Staking 6](documents/svg/Pict6ReStakingTransfer.svg)

#### stRari calculate

Amount **stRari** is calculated by the formula:

stRari = k * Rari. 

K = (0.07 + 0.93 * (cliffPeriod / 104) ^ 2 + 0.5 * (0.07 + 0.93 * (slopePeriod / 104) ^ 2)).

Amount **stRari** depends on the values of period cliff and period slope. The longer the stake period, the more **stRari** 
the user will receive. Max staking period equal 2 years cliff period and 2 years slope period. 
The K coefficient changes non-linearly, as shown in the picture 7. 

![Staking 7](documents/svg/Pict7GgraphicK.svg)

#### stRari delegation

Delegation is the right of the user to designate the beneficiary of the staked amount of **Rari**. In other words, 
the user has the right to assign the address of another user or contract to whom the **stRari** will be listed.
The delegation only touches on **stRari**, not on the amount of **Rari**. Calling method withdraw() **Rari** always 
enumerates owner Lock, even if **stRari** is assigned to another user or contract.

The delegation mechanism is very flexible. Delegation can be done by calling *stake()*, the entire amount of **stRari** 
will be enumerated to another user. Delegation can be done by calling the *restake()* method, but this method aims 
to change the **Lock** parameters. If there is no need to change the **Lock** parameters, the authors of the staking contract
recommend using the *depute()* method. The method aims to translate **stRari** for Lock with the given id. A delegated
**Lock** with a given id can be redelegated an unlimited number of times. There is only one limitation, the delegation can
only be owner **Lock**.

##### Contract events
Staking contract emits these events:
- Stake(when create new deposit)
- ReStake(when change deposit parameters)
- Delegate(when set new delegate)
- Withdraw(when withdraw amount of Rari)
- Migrate(when migrate deposits to new contract)

### Description methods
##### Only owner contract methods
**stop**(); Set stop mode for contract. Stop mode means impossible to *stake()*, *reStake()*, *delegate()*
*withdraw()* enumerates all amount of Rari. When false - ordinary work.

**startMigration**(address *to*); Set addres new contract, allow migration.
- Input parameter: *to* - address new contract;

##### External methods
**__Staking_init**(IERC20Upgradeable *_token*); Initialize contract.
- Input parameter: *_token* - token for ERC20 transfer;

**stake**(address *account*, address *delegate*, uint *amount*, uint *slope*, uint *cliff*) returns (uint); Stake Lock, return id Lock
- Input parameter: *account* - address Lock owner;
- Input parameter: *delegate* - address stRari delegate;
- Input parameter: *amount* - amount Rari;
- Input parameter: *slope* - value slope;
- Input parameter: *cliff* - amount cliff;
- Output: idLock. if 0 - can`t stake.

**reStake**(uint *idLock*, address *newDelegate*, uint *newAmount*, uint *newSlope*, uint *newCliff*) returns (uint); Restake Lock with id, return new id Lock
- Input parameter: *idLock* - id Lock to restake;
- Input parameter: *newDelegate* - address stRari delegate;
- Input parameter: *newAmount* - amount Rari;
- Input parameter: *newSlope* - value slope;
- Input parameter: *newCliff* - amount cliff.
- Output: new idLock. if 0 - can`t reStake.

**withdraw**(); Withdraw available amount of Rari to User.

**depute**(uint *idLock*, address *newDelegate*); Delegate Lock with id to delegate.
- Input parameter: *idLock* - id Lock to restake;
- Input parameter: *newDelegate* - address stRari delegate;

**totalSupply**() returns (uint); Returns total amount stRari, staked on *staking* contract.
- Output: amount stRari. if 0 - can`t return amount stRari.

**balanceOf**(address *account*) returns (uint); Returns total amount stRari, staked on User with *account*.
- Output: amount stRari. if 0 - can`t return amount stRari.

**migrate**(uint[] memory *idLock*); Migrate Locks with id to a new contract.
- Input parameter: *idLock* - array contains id Locks to migrate.