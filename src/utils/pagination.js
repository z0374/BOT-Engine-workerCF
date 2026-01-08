
  async function recItems(comand, userState, table){
    await sendCallBackMessage("Entrou em canListItems", chatId, env);

    if(prefixComand == "pagina_produtos"){
        userState.page = comand[2];
    }

        const endId = userState.page * itemsForPage;
        const beginId = userState.page == 1 ? userState.page++ : endId - itemsForPage;
    productsVizualization = await dataRead(table, {interval: [beginId, endId]}, env, chatId);
    userState.page++;

      await saveUserState(env, userId, userState);
    for (const v of categoriesData) {
      const itemsByCategories = productsVizualization.flat().filter(obj => String(obj.type) === String(v));

      itemsList += `\n<b>${normalize(v)}</b>\n`;

      for (const i of itemsByCategories) {
        const assetId = i.data.split(",")[0];
        const nameItems = await dataRead(
          "assets",
          { id: assetId },
          env
        );

        itemsList += `${indent} /${normalize(
          nameItems.data
        )}_Produtos\n`;
      }

      categoriesList += `\n${indent}\n/${normalize(v)}_ver_Produtos`;
    }

    return {
      categories: categoriesList,
      products: productsVizualization,
      items: itemsList
    }
}