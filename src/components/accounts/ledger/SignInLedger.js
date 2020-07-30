import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Theme from './PageTheme.css';
import LedgerImage from '../../svg/LedgerImage';
import FormButton from '../../common/FormButton';
import { Translate } from 'react-localize-redux';
import LedgerConfirmActionModal from './LedgerConfirmActionModal';
import { signInWithLedger, clear, redirectToApp, refreshAccount } from '../../../actions/account';
import RequestStatusBox from '../../common/RequestStatusBox'

export function SignInLedger(props) {
    const dispatch = useDispatch();
    const account = useSelector(({ account }) => account);
    const ledger = useSelector(({ ledger }) => ledger);

    const gettingAccounts = account.actionsPending.includes('GET_LEDGER_ACCOUNT_IDS')
    const addingAccounts = account.actionsPending.includes('ADD_LEDGER_ACCOUNT_ID')
    const savingAccounts = account.actionsPending.includes('SAVE_AND_SELECT_LEDGER_ACCOUNTS')
    const signingIn = gettingAccounts || addingAccounts || savingAccounts

    const ledgerAccounts = addingAccounts && Object.keys(ledger.signInWithLedger).map((accountId) => ({
        accountId,
        status: ledger.signInWithLedger[accountId].status
    }))

    const accountsApproved = Object.keys(ledger.signInWithLedger || {}).reduce((a, accountId) => ledger.signInWithLedger[accountId].status === 'success' ? a + 1 : a, 0)
    const totalAccounts = Object.keys(ledger.signInWithLedger || {}).length

    const handleSignIn = async () => {
        const { error } = await dispatch(signInWithLedger())

        if (!error) {
            dispatch(refreshAccount())
            dispatch(redirectToApp())
        }
    }

    return (
        <Theme>
            <h1><Translate id='signInLedger.header'/></h1>
            <LedgerImage/>
            <p><Translate id='signInLedger.one'/></p>
            <br/>
            <RequestStatusBox requestStatus={account.requestStatus}/>
            <FormButton
                onClick={handleSignIn}
                sending={signingIn}
                sendingString='button.signingIn'
            >
                <Translate id={`button.${account.requestStatus && !account.requestStatus.success ? 'retry' : 'signIn'}`}/>
            </FormButton>
            <button className='link' onClick={() => props.history.goBack()}><Translate id='button.cancel'/></button>

            {signingIn &&
                <LedgerConfirmActionModal 
                    open={signingIn} 
                    onClose={() => dispatch(clear())}
                    ledgerAccounts={ledgerAccounts} 
                    gettingAccounts={gettingAccounts}
                    addingAccounts={addingAccounts}
                    accountsApproved={accountsApproved}
                    totalAccounts={totalAccounts}
                />
            }
        </Theme>
    );
}
