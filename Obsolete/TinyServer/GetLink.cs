//---------------------------------------------------------------------------------------------
// <copyright file="GetLink.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//    Last Updated    : 03-Feb-2018 21:34EST
//    Revisions:
//       Version    | Author                   | Email                     | Remarks
//       1.0        | Dileep Miriyala          | m.dileep@gmail.com        | Initial Commit
//       _._        | <TODO>                   |   <TODO>                  | <TODO>
// </copyright>
//---------------------------------------------------------------------------------------------

using Server.Util;
using System.Web;

namespace Server
{
	public class GetLink : IHttpHandler
	{
		public void ProcessRequest(HttpContext context)
		{
			context.Response.ContentType = "text/html";

			string p = context.Request.Form["p"];
			try
			{
				MongoLib.MongoUtil2 MU = new MongoLib.MongoUtil2();

				Link L = MU.Find(p);

				context.Response.Write(L.Data);
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
