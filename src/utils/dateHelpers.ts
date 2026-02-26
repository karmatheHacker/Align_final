export const calculateAge = (digits: string[]): number => {
    if (!digits || digits.length !== 8) return 0;

    const day = parseInt(digits[0] + digits[1]);
    const month = parseInt(digits[2] + digits[3]);
    const year = parseInt(digits[4] + digits[5] + digits[6] + digits[7]);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;

    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

export const getBirthDateString = (digits: string[]): string => {
    if (!digits || digits.length !== 8) return '';

    const day = digits[0] + digits[1];
    const month = digits[2] + digits[3];
    const year = digits[4] + digits[5] + digits[6] + digits[7];

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const monthIndex = parseInt(month) - 1;
    if (monthIndex < 0 || monthIndex > 11) return '';

    return `${monthNames[monthIndex]} ${parseInt(day)}, ${year}`;
};
