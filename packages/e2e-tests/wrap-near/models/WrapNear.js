class WrapNearPage {
    constructor(page) {
        this.page = page;
    }
    async navigate() {
        await this.page.goto(`/wrap`);
    }
    async typeAmount(amount) {
        await this.page.fill(
            `data-test-id=wrappingFromAmountInput`,
            amount.toString()
        );
    }
    async typeAndSubmitAmount(amount) {
        await this.typeAmount(amount);
        await this.page.click("data-test-id=wrapNearPageSubmitAmountButton");
    }
    async selectAsset(assetContractName) {
        await this.page.click(`data-test-id=sendMoneyPageSelectTokenButton`);
        await this.page.click(
            `data-test-id=token-selection-${assetContractName}`
        );
    }
    async typeAccountId(accountId) {
        await this.page.fill(
            "data-test-id=sendMoneyPageAccountIdInput",
            accountId
        );
    }
    async typeAndSubmitAccountId(accountId) {
        await this.typeAccountId(accountId);
        await this.page.click(
            "data-test-id=sendMoneyPageSubmitAccountIdButton"
        );
    }
    async confirmTransaction() {
        await this.page.click("data-test-id=wrapNearPageConfirmButton");
    }

    async clickSwapTokenButton() {
        await this.page.click("data-test-id=swapWrappingTokenButton");
    }

    async waitForFromTokenBalance() {
        // wait for the balance display to contain any character more than 0
        await this.page.waitForSelector(
            '[data-test-id=wrappingFromAmountInputView] >> div:text-matches("[1-9]")'
        );
    }
}
module.exports = { WrapNearPage };
