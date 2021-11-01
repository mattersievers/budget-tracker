//var to hold db connection
let db;

// establish connection called budget_tracker with IndexedDB and set it to version 1
const request = indexedDB.open('budget_tracker', 1)

//check if db version changed
request.onupgradeneeded = function(event) {
    //save reference to the database
    const db = event.target.result;

    //create an object store
    db.createObjectStore('new_money_transaction', { autoIncrement: true });
}

//upon a successful
request.onsuccess = function(event) {
    db = event.target.result;

    if(navigator.onLine) {
        uploadMoneyTransaction();       
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

//attempt to submit a money transaction with no internet connection
function saveRecord(record) {
    //open a new transaction
    const transaction = db.transaction(['new_money_transaction'], 'readwrite');
    //access the object store
    const moneyTransactionObjectStore = transaction.objectStore('new_money_transaction');
    //add record to the store with the add method
    moneyTransactionObjectStore.add(record);
}

function uploadMoneyTransaction()  {
    const transaction = db.transaction(['new_money_transaction'], 'readwrite');
    const moneyTransactionObjectStore = transaction.objectStore('new_money_transaction');

    const getAll = moneyTransactionObjectStore.getAll();

    //get all records from store and set to a variable
    getAll.onsuccess = function() {
        if(getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if(serverResponse.message){
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['new_money_transaction'], 'readwrite');
                    const moneyTransactionObjectStore = transaction.objectStore('new_money_transaction');
                    moneyTransactionObjectStore.clear();

                    alert('All saved money transactions have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
}


//listen for app coming back online
window.addEventListener('online', uploadMoneyTransaction);