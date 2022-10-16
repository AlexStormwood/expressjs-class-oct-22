// Firebase Admin SDK was initialized elsewhere, we just need access to its functions.
const admin = require('firebase-admin');

// Set up the Firebase Client SDK
const {firebaseClientConfig} = require('../../keys/FirebaseClientKey');
// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
const firebase = require("firebase/app");
// Add the Firebase products that you want to use
const { getAuth, signInWithEmailAndPassword } = require("firebase/auth");
require("firebase/firestore");
firebase.initializeApp(firebaseClientConfig);

const firebaseAuthInstance = getAuth();

async function signUpUser(userDetails){
    // Use the Firebase Admin to make a user
    return admin.auth().createUser({
        email: userDetails.email,
        emailVerified: false,
        password: userDetails.password,
        displayName: userDetails.displayName,
        disabled: false,
    }).then(async (userRecord) => {
        userRecord.accountLocale = userDetails.accountLocale || "en";
        console.log("User record raw is \n" + JSON.stringify(userRecord));
        // Give the use "Claims", which is Firebase's authorization system for data access control
        let defaultUserClaims = admin.auth().setCustomUserClaims(userRecord.uid, {regularUser: true}).then(() => {
            console.log(`Set a regularUser claim to the new user with email of ${userRecord.email}! They must log in again to get the new access.`);
            // You can do things like detect values in the email address (eg. if the new user email is the project admin email) and set the claim object to include other values.
            // Claims allow you to handle authorization without ever giving the client any data that they could hack or manipulate.
            // Of course, you can still pass the claims along to the client if you want to (eg. for front-end authorization to hide content), just know that front-end authorization isn't bulletproof.

        });
        
        return userRecord;
        
    }).catch(error => {
        console.log(error);
        return {error:error};
    });
}


async function signInUser(userDetails){
    // console.log("Signing in user via NodeJS now...\n User details are \n" + JSON.stringify(userDetails));
    try {
        let signedInUserCred = await signInWithEmailAndPassword(firebaseAuthInstance, userDetails.email, userDetails.password)
        let userIdToken = await signedInUserCred.user.getIdTokenResult(false);
        
        return {
            idToken:userIdToken.token,
            refreshToken:signedInUserCred.user.refreshToken,
            email:signedInUserCred.user.email,
            emailVerified: signedInUserCred.user.emailVerified,
            displayName:signedInUserCred.user.displayName,
            photoURL:signedInUserCred.user.photoURL,
            uid:signedInUserCred.user.uid
        };

    } catch (errorObj){
        switch (errorObj.code) {
            case "auth/invalid-email":
            case "auth/wrong-password":
                return {
                    error: "Incorrect sign-in information provided.",
                };
            default:
                console.error(`User ${userDetails.email} failed sign in: ` + errorObj);
                return {
                    error: "Sign In Failed For Some Uncaught Reason",
                    errorRaw: errorObj
                };
        }
        
    } 

}

async function validateUserSession(sessionDetails){
    let userRefreshToken = sessionDetails.refreshToken;
    let userIdToken = sessionDetails.idToken;

    return firebaseAdmin.auth().verifyIdToken(userIdToken, true).then(async (decodedToken) => {

        console.log(`Decoded session token is ${JSON.stringify(decodedToken)}`);

        return {
            isValid: true,
            uid: decodedToken.uid,
            fullDecodedToken: decodedToken
        }
    }).catch((error) => {
        if (error.code == 'auth/id-token-revoked') {
            // Token has been revoked. Inform the user to reauthenticate or signOut() the user.
            console.log("You must sign in again to access this. Full error is: \n" + error);
        } else {
            // Token is invalid.
            console.log("Session token is invalid. Full error is: \n" + error);
        }
          
        return {error:error};
    });
}


module.exports = {
    signUpUser, signInUser, validateUserSession
}