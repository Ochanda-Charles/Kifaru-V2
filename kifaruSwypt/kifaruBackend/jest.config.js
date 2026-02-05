module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    collectCoverageFrom: ['src/**/*.{ts,js}', '!src/**/*.d.ts'],
    coverageDirectory: 'coverage',
    verbose: true,
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            isolatedModules: true,
        }],
    },
};
