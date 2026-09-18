const currentTiers = [
    {
        id: 't1',
        name: 'General',
        price: 499,
        totalQuantity: 100,
        soldQuantity: 20,
    },
    { id: 't2', name: 'VIP', price: 999, totalQuantity: 50, soldQuantity: 10 },
]
const incomingTiers = [
    { id: 't1', name: 'General', price: 499, totalQuantity: 120 }, // wants to expand General capacity
    { id: 't2', name: 'VIP', price: 999, totalQuantity: 5 }, // wants to shrink VIP capacity below sold!
]

function validateTierUpdate(currentTiers, incomingTiers) {
    //    Challenge 1
    // currentTiers.map((tier) => console.log('current Tier', tier))
    // incomingTiers.map((tier) => console.log('incoming Tier', tier))

    // Challenge 2
    for (const currentTier of currentTiers) {
        const incomingMatch = incomingTiers.find((t) => t.id === currentTier.id)
        if (incomingMatch.totalQuantity < currentTier.soldQuantity) {
            console.log(
                'Total Ticket Quantity is Greater than the Quantity Already Sold',
            )
        } else {
            console.log(
                `Valid update for ${currentTier.name}: updating capacity to ${incomingMatch.totalQuantity}`,
                (currentTier.totalQuantity = incomingMatch.totalQuantity),
            )
        }
    }
    console.log('Updated currentTiers:', JSON.stringify(currentTiers, null, 2))
}

validateTierUpdate(currentTiers, incomingTiers)
