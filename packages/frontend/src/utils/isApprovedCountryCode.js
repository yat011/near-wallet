import { SMS_BLACKLIST } from '../config';

const isApprovedCountryCode = (countryCode) => {
    const blackList = SMS_BLACKLIST.replace(/\s/g, "").split(",");
    return !blackList.includes(countryCode);
};

export default isApprovedCountryCode;