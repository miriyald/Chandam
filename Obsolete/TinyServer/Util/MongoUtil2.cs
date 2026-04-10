//---------------------------------------------------------------------------------------------
// <copyright file="MongoUtil2.cs" company="Chandam-ఛందం">
//    Copyright © Since 2013  'Chandam-ఛందం' : https://github.com/miriyald/chandam
//    Original Author : Dileep Miriyala
//    Last Updated    : 03-Feb-2018 21:34EST
//    Revisions:
//       Version    | Author                   | Email                     | Remarks
//       1.0        | Dileep Miriyala          | m.dileep@gmail.com        | Initial Commit
//       _._        | <TODO>                   |   <TODO>                  | <TODO>
// </copyright>
//---------------------------------------------------------------------------------------------

using MongoDB.Driver;
using MongoDB.Driver.Builders;
using Server.Util;
using Server.Util.Secrets;

namespace MongoLib
{
	public class MongoUtil2
	{

		MongoDatabase database;
		MongoServer server;
		MongoCollection<Link> collection;
		public MongoUtil2()
		{

			var url = new MongoUrl(Constants.DataConnectionString);
			var client = new MongoClient(url);
			server = client.GetServer();
			database = server.GetDatabase(url.DatabaseName);
			collection = database.GetCollection<Link>(Constants.SaveCollection);
		}
		public void Add(Link Metric)
		{
			collection.Insert(Metric);
		}

		public Link Find(string p)
		{
			var query = Query.And(Query.EQ("Key", p ?? ""));
			Link item = collection.FindOne(query);
			return item;
		}
	}

}
