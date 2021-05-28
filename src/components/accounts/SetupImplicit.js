import React, { Component } from 'react'
import styled from 'styled-components'
import { formatNearAmount } from 'near-api-js/lib/utils/format'
import BN from 'bn.js'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { Translate } from 'react-localize-redux'
import Container from '../common/styled/Container.css'
import FormButton from '../common/FormButton'
import WhereToBuyNearModal from '../common/WhereToBuyNearModal'
import AccountFundedModal from './AccountFundedModal'
import { createAccountFromImplicit, redirectTo } from '../../actions/account'
import { MIN_BALANCE_TO_CREATE, wallet} from '../../utils/wallet'
import { Mixpanel } from '../../mixpanel'
import { isMoonpayAvailable, getSignedUrl } from '../../utils/moonpay'
import AccountFundedStatus from './create/AccountFundedStatus'
import Divider from '../common/Divider'
import FundWithMoonpay from './create/FundWithMoonpay'

const StyledContainer = styled(Container)`

    h2 {
        b {
            color: #3F4045;
        }
    }
    button {
        margin: 0 auto !important;
        width: 100% !important;

        &.where-to-buy-link {
            text-decoration: none !important;
            font-weight: 400 !important;
            font-size: 16px !important;
            width: auto !important;
            text-align: left;
            margin-bottom: 50px !important;
            transition: 100ms;

            :hover {
                text-decoration: underline !important;
            }
        }

        &.black {
            height: 54px !important;
            width: 100% !important;
            display: flex !important;
            align-items: center;
            justify-content: center;
            border: 0 !important;

            svg {
                width: initial !important;
                height: initial !important;
                margin: initial !important;
                margin-left: 10px !important;
            }
        }
    }

    .divider-container {
        margin: 50px 0;
    }

    &.funded {
        .funded {
            margin: 60px 0;
        }
    }
`
class SetupImplicit extends Component {
    state = { 
        balance: null,
        whereToBuy: false,
        createAccount: null,
        moonpayAvailable: false,
        moonpaySignedURL: null,
     }

    handleContinue = async () => {
        const { dispatch, accountId, implicitAccountId, recoveryMethod } = this.props
        this.setState({ creatingAccount: true })
        await Mixpanel.withTracking("CA Create account from implicit", 
            async () => {
                await dispatch(createAccountFromImplicit(accountId, implicitAccountId, recoveryMethod))
            },
            () => {
                this.setState({ creatingAccount: false })
            }
        )
        dispatch(redirectTo('/fund-create-account/success'))
    }

    checkMoonPay = async () => {
        const { implicitAccountId } = this.props
        await Mixpanel.withTracking("CA Check Moonpay available", 
            async () => {
                const moonpayAvailable = await isMoonpayAvailable()
                if (moonpayAvailable) {
                    const moonpaySignedURL = await getSignedUrl(implicitAccountId, window.location.origin)
                    this.setState({ moonpayAvailable, moonpaySignedURL })
                }
            },
            (e) => console.warn('Error checking Moonpay', e)
        )
    }

    checkBalance = async () => {
        const { implicitAccountId } = this.props
        const { createAccount } = this.state

        const account = await wallet.getAccountBasic(implicitAccountId)
        if (!createAccount) {
            await Mixpanel.withTracking("CA Check balance from implicit",
                async () => {
                    const state = await account.state()
                    if (new BN(state.amount).gte(MIN_BALANCE_TO_CREATE)) {
                        Mixpanel.track("CA Check balance from implicit: sufficient")
                        this.setState({ 
                            balance: state.amount,
                            whereToBuy: false,
                            createAccount: true
                        })
                        window.scrollTo(0, 0);
                        return;
                    } else {
                        Mixpanel.track("CA Check balance from implicit: insufficient")
                    }
                },
                (e) => { 
                    if (e.message.indexOf('exist while viewing') === -1) {
                        throw e
                    }
                    this.setState({ balance: 0 })
                }
            )
        }
    }

    componentDidMount = () => {
        // TODO: Check if account has already been created and if so, navigate to dashboard
        this.interval = setInterval(() => this.checkBalance(), 2000)
        this.checkMoonPay()
    }

    componentWillUnmount = () => {
        clearInterval(this.interval)
    }

    handleClaimAccount = () => {
        const { dispatch, accountId, activeAccountId } = this.props;
        if (accountId === activeAccountId) {
            dispatch(redirectTo('/'))
            return;
        }
        this.setState({ claimMyAccount: true });
    }

    render() {
        const {
            whereToBuy,
            createAccount,
            moonpayAvailable,
            moonpaySignedURL,
            balance,
            claimMyAccount,
            creatingAccount
        } = this.state

        const { implicitAccountId, accountId, mainLoader } = this.props;

        if (createAccount) {
            return (
                <StyledContainer className='small-centered funded' >
                    <h1><Translate id='account.createImplicit.post.title' /></h1>
                    <h2><Translate id='account.createImplicit.post.descOne'/></h2>
                    <h2><b><Translate id='account.createImplicit.post.descTwo'/></b></h2>
                    {!creatingAccount &&
                        <AccountFundedStatus
                            fundingAddress={implicitAccountId}
                            intitalDeposit={balance}
                            accountId={accountId}
                        />
                    }
                    <FormButton
                        onClick={this.handleClaimAccount}
                        trackingId="CA implicit click claim my account"
                        disabled={creatingAccount}
                    >
                        <Translate id='button.claimMyAccount' />
                    </FormButton>
                    {claimMyAccount &&
                        <AccountFundedModal
                            onClose={() => {}}
                            open={claimMyAccount}
                            implicitAccountId={implicitAccountId}
                            accountId={accountId}
                            handleFinishSetup={this.handleContinue}
                            loading={mainLoader}
                        />
                    }
                </StyledContainer>
            )
        }

        return (
            <StyledContainer className='small-centered'>
                <h1><Translate id='account.createImplicit.pre.title' /></h1>
                <h2><Translate id='account.createImplicit.pre.descOne' data={{ amount: formatNearAmount(MIN_BALANCE_TO_CREATE) }}/></h2>
                <FormButton
                    onClick={() => this.setState({ whereToBuy: true })}
                    color='link'
                    className='where-to-buy-link'
                    trackingId="CA Click where to buy button"
                >
                    <Translate id='account.createImplicit.pre.whereToBuy.button' />
                </FormButton>
                <AccountFundedStatus
                    fundingAddress={implicitAccountId}
                    minDeposit={MIN_BALANCE_TO_CREATE}
                />
                {moonpayAvailable &&
                    <>
                        <Divider/>
                        <FundWithMoonpay
                            moonpaySignedURL={moonpaySignedURL}
                        />
                    </>
                }
                {whereToBuy &&
                    <WhereToBuyNearModal
                        onClose={() => this.setState({ whereToBuy: false })}
                        open={whereToBuy}
                    />
                }
            </StyledContainer>
        )
    }
}

const mapStateToProps = ({ account, status }, { match: { params: { accountId, implicitAccountId, recoveryMethod } } }) => ({
    ...account,
    activeAccountId: account.accountId,
    accountId,
    implicitAccountId,
    recoveryMethod,
    mainLoader: status.mainLoader
})

export const SetupImplicitWithRouter = connect(mapStateToProps)(withRouter(SetupImplicit))
