import React from 'react';

import Balance from '../../common/balance/Balance';
import TokenAmount from './TokenAmount';

const RawTokenAmount = ({
    symbol,
    amount,
    decimals,
    withSymbol = true,
    showFiatAmountForNonNearToken
}) => {
    if (symbol !== "NEAR") {
        return (
            <TokenAmount
                token={{ symbol, decimals, balance: amount }}
                withSymbol={withSymbol}
                showFiatAmount={showFiatAmountForNonNearToken}
            />
        );
    } else {
        return <Balance amount={amount} symbol={withSymbol ? 'near' : false}
            showBalanceInUSD={showFiatAmountForNonNearToken}
        />;
    }
};

export default RawTokenAmount;