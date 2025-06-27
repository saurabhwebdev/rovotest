import { getApps, initializeApp, cert } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin';

const serviceAccount: ServiceAccount = {
  "type": "service_account",
  "project_id": "truckflow-df4dd",
  "private_key_id": "ae5556d8bbed58775d89f815bcfd82207601d4f1",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDE4VJ0UkbGTkbm\nWBcnBF0TYVd0GMRL0f/c7xLeDpm+qSHDCyCvY/GpjBUeKWo+wUKbi90H9IfVpWY0\nRBuyeSbao016cGkco394BFNtPLUbHLQDOn7kV+WqwJCFF4gjJwELwettc1s/d0t+\nmBSVlLW8xUIIH5Igg8EvRjdIUFEtk0ulSWRamv6ATOcfMMBi88rLuQOWg+LBI7qT\nkaH9ISVA5NkMguIm0dgp1EIzHnsEFsHMol3VWmxiS2r6Uw2RT/oPHvnN9Ig46G/T\nEabB40mp0TEtMHGFtuZMbueefuOBpE2J6ibvOopkj2q/AYjhe/RF8Sb7Mn7dUctx\neZWBXH+XAgMBAAECggEAQ/B7ay+fQ7xsY/2fE7RCSDdNnf8T8hQoJr4LdTx1mqEz\nyOI0p8Gl+bug5/UjuD8ptJKJtj6Qh03Z3IxqQGblXQqAaJGU/DCBgtF/VpFd79qy\nVfDgK/0XAJsN5BewP20sw7lp/C2UHe0VTLy/UbTtGBS8CiCW5QiCaEVjO12X/dEc\n/nYQzYkyrWSP1+7/dfcRL+oCHciU6/CuDpluLWDscfd6TAEzso74wSFdyELzhS9q\nshkJ/xQXx5gapCXUa5LzgeFeJUZ3Qpkky85uBuNJsyB6ALoI+RqMve/5xlnM89Wz\nnsCZ4SHkr8cD8V8++ZseKrKvG4CRWaV66LkrGN8boQKBgQDoZmg7UlbT51NSXrsR\nUXJk7aL9hFdxZjeL9AFfqDNvvaOh6DNhRkrzguaFve3gu3j0HLKKwVAwx0ZePEG/\nJIzrnr3PgDK75kS/jPE2aTnN01byCpgpg64v55G64MCsu9drWPlu6xEEr7ub3v0F\nCVYQSBkcIaQWB/nqdhzcc5zxIQKBgQDY34We63r32bcO77W1iEbbRQq4fnYDPinv\nxfim0ZF76HzIPNFSHkMysE+xIYjr1Dpw1PMRCQCVnJ37RIdUgqCZMRZHmPDmHSwK\ndVPCKr7zVEbUykooBFlA8PWbGrGSdeBE3YGUr1dACZqP4eOPPT+jxvTewH+K9D92\nMJeR+NsBtwKBgAdYDR0qyfGiUsC8m569eybzV345a2X6+/BhQpXaQ93ZGU2pf84o\nIYA2d8BsMxMx+W2FZqL53uXbtj6OGunGZumfN5JSE8haS3veIVU92ATIE+xMJ2jQ\nb3W2FKXaKlyLBxCuXBuENCJ4xy3yyv4YwG59SMXZzkyf7ebZ2qmgwanhAoGBAKFj\nZUpoLnA3AjUJSY23xhLyhBHbefLb1dVq26k4ly1AS2uvZo3Xm2YjMoq8S+pDWuIQ\ndnmc22R60k3kJ1lKhDy7/Lp3I/36g4Wc3iHGMadedf9wMlMpOUpMhllQOgil06kr\ntXxyJ1muS+j6zp8Pk0ZLjnodgkxjir5nVsP4DvJtAoGAYWudAp3s8KI+MpsxOFGU\n5gPB4PGCgETgxhA9+EBmwUZDyK1TYGk4Adlwo+y3OvQxQpHn4IFiIV+Y9I65W6Iz\nlbDII3FYAW0K1NmJrhi1YXb5KatXlyz645+RigwrT2a9Zf97e65XkI0z3Yvt233s\nZqrJXtUiLaBshAdMMdfVdLo=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@truckflow-df4dd.iam.gserviceaccount.com",
  "client_id": "106050611118764907398",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40truckflow-df4dd.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

export const initAdmin = () => {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
}; 