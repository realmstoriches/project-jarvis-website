// docs/src/api/models/userModel.js

// In a real application, this would be a database connection.
// For this example, we'll use a simple in-memory array.
const users = [
    { id: 1, name: 'John Doe', email: 'john.doe@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com' }
];

module.exports = {
    getAllUsers: () => users,
    getUserById: (id) => users.find(u => u.id === parseInt(id)),
};