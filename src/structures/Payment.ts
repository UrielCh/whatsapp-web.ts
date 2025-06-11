import Client from '../Client.ts';
import Base from './Base.ts';

/**
  * Represents a Payment on WhatsApp
  *
  * @example
  * {
  * id: {
  * fromMe: true,
  * remote: {
  * server: 'c.us',
  * user: '5511999999999',
  * _serialized: '5511999999999@c.us'
  * },
  *  id: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  * _serialized: 'true_5511999999999@c.us_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  * },
  * paymentCurrency: 'BRL',
  * paymentAmount1000: 1000,
  * paymentMessageReceiverJid: {
  * server: 'c.us',
  * user: '5511999999999',
  * _serialized: '5511999999999@c.us'
  * },
  * paymentTransactionTimestamp: 1623463058,
  * paymentStatus: 4,
  * paymentTxnStatus: 4,
  * paymentNote: 'note'
  * }
  */

class Payment extends Base {
    /** Payment Id*/
    id: object;
    /** Payment currency */
    paymentCurrency: string;
    /** Payment ammount  */
    paymentAmount1000 : number;
    /** Payment receiver */
    paymentMessageReceiverJid : object;
    /** Payment transaction timestamp */
    paymentTransactionTimestamp : number;
    /** Payment paymentStatus */
    paymentStatus : number;
    /** Integer that represents the payment Text */
    paymentTxnStatus  : number;
    /** The note sent with the payment */
    paymentNote  : string;
    
    constructor(client: Client, data: any) {
        super(client);

        if (data) this._patch(data);
    }

    override _patch(data: any): any {
        /**
         * The payment Id
         * @type {object}
         */
        this.id = data.id;

        /**
         * The payment currency
         * @type {string}
         */
        this.paymentCurrency = data.paymentCurrency;

        /**
         * The payment ammount ( R$ 1.00 = 1000 )
         * @type {number}
         */
        this.paymentAmount1000 = data.paymentAmount1000;

        /**
         * The payment receiver
         * @type {object}
         */
        this.paymentMessageReceiverJid = data.paymentMessageReceiverJid;

        /**
         * The payment transaction timestamp
         * @type {number}
         */
        this.paymentTransactionTimestamp = data.paymentTransactionTimestamp;

        /**
         * The paymentStatus
         *
         * Possible Status
         * 0:UNKNOWN_STATUS
         * 1:PROCESSING
         * 2:SENT
         * 3:NEED_TO_ACCEPT
         * 4:COMPLETE
         * 5:COULD_NOT_COMPLETE
         * 6:REFUNDED
         * 7:EXPIRED
         * 8:REJECTED
         * 9:CANCELLED
         * 10:WAITING_FOR_PAYER
         * 11:WAITING
         * 
         * @type {number}
         */
        this.paymentStatus = data.paymentStatus;

        /**
         * Integer that represents the payment Text
         * @type {number}
         */
        this.paymentTxnStatus = data.paymentTxnStatus;

        /**
         * The note sent with the payment
         * @type {string}
         */
        this.paymentNote = !data.paymentNoteMsg ? undefined : data.paymentNoteMsg.body ?  data.paymentNoteMsg.body : undefined ;

        return super._patch(data);
    }

}

export default Payment;
