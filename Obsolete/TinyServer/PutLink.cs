//---------------------------------------------------------------------------------------------
// <copyright file="PutLink.cs" company="Chandam-ఛందం">
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
using System;
using System.Web;

namespace Server
{
	public class PutLink : IHttpHandler
	{
		public void ProcessRequest(HttpContext context)
		{

			context.Response.ContentType = "text/html";

			string t = context.Request.Form["d"];

			if (string.IsNullOrEmpty(t))
			{
				context.Response.Write("");
				return;
			}



			try
			{
				string _Key = Guid.NewGuid().ToString();
				MongoLib.MongoUtil2 MU = new MongoLib.MongoUtil2();

				MU.Add(new Link
				{
					Key = _Key,
					Data = t
				});

				context.Response.Write(_Key);
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
