/**
 * Helper function to reduce an array of booleans to a single boolean value
 * @param m 
 * @param n 
 * @returns 
 */
export const performReduce = (m: any[], n: number) => {
    return (m.reduce((m, n) => m + (n === true), 0)) >= n;
}