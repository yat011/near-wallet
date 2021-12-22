const { test, expect } = require("@playwright/test");
const { parseNearAmount } = require("near-api-js/lib/utils/format");
const BN = require("bn.js");

const { HomePage } = require("../register/models/Home");
const { WrapNearPage } = require("./models/WrapNear");
const { getBankAccount } = require("../utils/account");
const { walletNetwork } = require("../utils/config");

const { describe, beforeAll, afterAll } = test;

describe("Wrapping NEAR tokens", () => {
    let firstAccount;

    beforeAll(async () => {
        const bankAccount = await getBankAccount();
        firstAccount = bankAccount.spawnRandomSubAccountInstance();
        await firstAccount.create();
    });

    afterAll(async () => {
        await firstAccount.delete();
    });

    test("navigates to wrap near page", async ({ page }) => {
        const firstAccountHomePage = new HomePage(page);

        await firstAccountHomePage.navigate();

        await firstAccountHomePage.loginWithSeedPhraseLocalStorage(firstAccount.accountId, firstAccount.seedPhrase);

        await firstAccountHomePage.navigate();

        await firstAccountHomePage.clickWrapButton();

        await expect(firstAccountHomePage.page).toMatchURL(/wrap$/);
    });
    describe("Wrapping wNEAR", () => {
        test("is able to wrap NEAR to wNEAR", async ({ page }) => {
            const firstAccountHomePage = new HomePage(page);

            await firstAccountHomePage.navigate();

            await firstAccountHomePage.loginWithSeedPhraseLocalStorage(firstAccount.accountId, firstAccount.seedPhrase);
            const wrapNearPage = new WrapNearPage(page);


            const wrapAmount = 0.1;
            const contractName = `wrap.${walletNetwork}`;

            const beforeWNearBalance = new BN(await firstAccount.getFungibleTokenBalance(contractName));
            await wrapNearPage.navigate();

            await wrapNearPage.waitForFromTokenBalance();
            await wrapNearPage.typeAndSubmitAmount(wrapAmount);
            await wrapNearPage.confirmTransaction();

            await expect(page).toMatchText("data-test-id=wrapNearTransactionSuccessMessage", new RegExp(`wrapped`));
            await expect(page).toMatchText("data-test-id=wrapNearTransactionSuccessMessage", new RegExp(`${wrapAmount} NEAR`));
            await expect(page).toMatchText("data-test-id=wrapNearTransactionSuccessMessage", new RegExp(`to ${wrapAmount} wNEAR`));


            const afterWNearBalance = new BN(await firstAccount.getFungibleTokenBalance(contractName));
            const wrappedAmount = new BN(parseNearAmount(wrapAmount.toString()));

            expect(afterWNearBalance.eq(beforeWNearBalance.add(wrappedAmount))).toBe(true);
        });
    });

    describe("Unwrapping wNEAR", () => {
        let secondAccount;
        beforeAll(async () => {
            const bankAccount = await getBankAccount();
            secondAccount = bankAccount.spawnRandomSubAccountInstance();
            await secondAccount.create();
            await secondAccount.wrapNear(parseNearAmount("0.5"));
        });

        afterAll(async () => {
            await secondAccount.delete();
        });

        test("is able to unwrap wNEAR tokens through clicking SwapToken button", async ({ page }) => {
            const firstAccountHomePage = new HomePage(page);

            await firstAccountHomePage.navigate();

            await firstAccountHomePage.loginWithSeedPhraseLocalStorage(secondAccount.accountId, secondAccount.seedPhrase);
            const wrapNearPage = new WrapNearPage(page);


            const wrapAmount = 0.2;
            const contractName = `wrap.${walletNetwork}`;

            const beforeWNearBalance = new BN(await secondAccount.getFungibleTokenBalance(contractName));
            await wrapNearPage.navigate();

            await wrapNearPage.clickSwapTokenButton();
            await wrapNearPage.waitForFromTokenBalance();
            await wrapNearPage.typeAndSubmitAmount(wrapAmount);
            await wrapNearPage.confirmTransaction();

            await expect(page).toMatchText("data-test-id=wrapNearTransactionSuccessMessage", new RegExp(`unwrapped`));
            await expect(page).toMatchText("data-test-id=wrapNearTransactionSuccessMessage", new RegExp(`${wrapAmount} wNEAR`));
            await expect(page).toMatchText("data-test-id=wrapNearTransactionSuccessMessage", new RegExp(`to ${wrapAmount} NEAR`));


            const afterWNearBalance = new BN(await secondAccount.getFungibleTokenBalance(contractName));
            const wrappedAmount = new BN(parseNearAmount(wrapAmount.toString()));


            expect(afterWNearBalance.eq(beforeWNearBalance.sub(wrappedAmount))).toBe(true);
        });
    });


});
