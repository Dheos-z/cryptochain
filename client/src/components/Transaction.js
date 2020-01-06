import React from 'react';

const Transaction = ({transaction }) => {
    const {input,outputMap} = transaction;
    const recipients = Object.keys(outputMap);

    return (
        <div className='Transaction'>
            <div>From: {`${input.address.substring(0,20)}...`} | Balance: {input.amount}</div>
            {
                // The arrow function is defined by parentheses and not curly brackets because
                // it is a way to substitute the return statement : you return data right from
                // the parentheses
                recipients.map(recipient => (
                    <div key={recipient}>
                        To: {`${recipient.substring(0,20)}...`} | Sent: {outputMap[recipient]}
                    </div>
                ))
            }
        </div>
    );
}

export default Transaction;