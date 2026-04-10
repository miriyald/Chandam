//---------------------------------------------------------------------------------------------
// <copyright file="Email.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//    Last Updated    : 03-Feb-2018 21:34EST
//    Revisions:
//       Version    | Author                   | Email                     | Remarks
//       1.0        | Dileep Miriyala          | m.dileep@gmail.com        | Initial Commit
//       _._        | <TODO>                   |   <TODO>                  | <TODO>
// </copyright>
//---------------------------------------------------------------------------------------------

using Server.Util.Secrets;
using System;
using System.Net;
using System.Net.Mail;

namespace Server
{
	public class Email
	{

		public void SendMail(string from, string toList, string subject, string body)
		{
			SendMail(from, toList, "", subject, body);
		}
		public void SendMail(string from, string toList, string ccList, string subject, string body)
		{

			MailMessage message = new MailMessage();
			SmtpClient smtpClient = new SmtpClient();
			try
			{
				MailAddress fromAddress = new MailAddress(from, "Chandam© ఛందం©");
				message.From = fromAddress;
				message.To.Add(toList);
				if (ccList != null && ccList != string.Empty)
				{
					message.CC.Add(ccList);
				}
				message.Subject = subject;
				message.IsBodyHtml = true;
				message.Body = body;
				smtpClient.Host = Constants.EmailHost;
				smtpClient.Port = Constants.EmailPort;
				smtpClient.EnableSsl = true;
				smtpClient.UseDefaultCredentials = true;
				smtpClient.Credentials = new NetworkCredential(Constants.EmailUser, Constants.EmailPwd);
				smtpClient.Send(message);
			}
			catch (Exception ex)
			{
				throw ex;
			}
		}
	}
}