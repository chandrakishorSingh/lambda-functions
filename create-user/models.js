const {formatDate} = require('./utils');

class User {
    constructor(firstName, lastName, email, phoneNumber) {
        this.FirstName = firstName;
        this.LastName = lastName;
        this.Email = email;
        this.PhoneNumber = phoneNumber;
        this.CreatedAt = formatDate(new Date());
        this.DeviceToken = 'null';
    }
}

exports.User = User;