<?php
// Mini Mart Loyalty Tier helper
// Shared calculation + metadata for the customer loyalty tier feature.
// Tiers are computed from a customer's lifetime total_spent.

if (!function_exists('calculate_loyalty_tier')) {
    /**
     * Return the loyalty tier for a given lifetime total_spent value.
     *
     * @param float|int|string $totalSpent
     * @return string one of: bronze, silver, gold, platinum
     */
    function calculate_loyalty_tier($totalSpent)
    {
        $amount = floatval($totalSpent);

        if ($amount >= 200.00) {
            return 'platinum';
        }
        if ($amount >= 100.00) {
            return 'gold';
        }
        if ($amount >= 50.00) {
            return 'silver';
        }
        return 'bronze';
    }
}

if (!function_exists('loyalty_tier_meta')) {
    /**
     * Tier display metadata (label + min spend threshold).
     * Frontend owns the visual colors; these labels are for backend use.
     *
     * @return array{label: string, min: float}
     */
    function loyalty_tier_meta()
    {
        return [
            'bronze'   => ['label' => 'Bronze',   'min' => 0.00],
            'silver'   => ['label' => 'Silver',   'min' => 50.00],
            'gold'     => ['label' => 'Gold',     'min' => 100.00],
            'platinum' => ['label' => 'Platinum', 'min' => 200.00],
        ];
    }
}
