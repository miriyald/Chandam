//---------------------------------------------------------------------------------------------
// <copyright file="Subscribe.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//    Last Updated    : 03-Feb-2018 21:33EST
//    Revisions:
//       Version    | Author                   | Email                     | Remarks
//       1.0        | Dileep Miriyala          | m.dileep@gmail.com        | Initial Commit
//       _._        | <TODO>                   |   <TODO>                  | <TODO>
// </copyright>
//---------------------------------------------------------------------------------------------

using Server.Util.DB;
using System.Web;

namespace Server
{
	public class Subscribe : IHttpHandler
	{


		public void ProcessRequest(HttpContext context)
		{
			string email = context.Request.Form["e"];
			string go = context.Request.Form["g"];

			context.Response.ContentType = "text/html";

			try
			{
				MongoLib.MongoUtil MU = new MongoLib.MongoUtil();

				MongoLib.MongoUtil M = new MongoLib.MongoUtil();
				if (M.EmailExists(email))
				{
					M.UpdateSubsription(new Subscription
					{
						EmailId = email,
						Allow = (go == "1")
					});
				}
				else
				{
					M.AddSubscription(new Subscription
					{
						EmailId = email,
						Allow = (go == "1")
					});
				}


				context.Response.Write("");
			}
			catch
			{
				context.Response.Write("");
				return;
			}
		}
		public bool IsReusable
		{
			get
			{
				return false;
			}
		}
	}
}
