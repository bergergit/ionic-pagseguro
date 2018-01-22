import { Injectable } from '@angular/core';
import { ToastController, AlertController, Loading, LoadingController } from 'ionic-angular';

@Injectable()
export class Utils {

  private TIMEOUT = 20000;
  private loader: Loading;
  
  constructor(public toastCtrl: ToastController, public alertCtrl: AlertController, public loadingCtrl: LoadingController) {
  }


  /**
   * Mostra mensagem de erro
   * @param errorKey 
   * @param error 
   */
  public showErrorAlert(msg: string, error: string) {
    let alert = this.alertCtrl.create({
      message: msg + '<br/><br/>' + error,
      buttons: [{
        text: "Ok",
        role: 'cancel'
      }]
    });
    alert.present();
  }

  public presentToast(msg: string) {
    let toast = this.toastCtrl.create({
      message: msg,
      duration: 4000,
      position: 'bottom'
    });
    toast.present();
  }

  /**
   * Useful method for executing a Promise while showing a message indicating the execution of this Promise
   * @param promise 
   * @param messageKey 
   */
  public executePromiseWithMessage(promise: Promise<any>, dismissLoader: boolean, msg: string): Promise<any> {
    // only show loader if there is a messageKey
    if (msg) {
      this.loader = this.loadingCtrl.create({
        content: msg,
        duration: this.TIMEOUT
      });
      this.loader.present();
    }

    return promise.then((result) => {
      if (this.loader && dismissLoader) this.loader.dismiss();
      return result;
    }).catch((error) => {
      if (this.loader) this.loader.dismiss();
      throw error;
    });
  }



}
