import { CommunityPage } from '../models/communityPage.js';
import { Op } from 'sequelize';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

/**
 * Criar uma nova página (Publicação ou Subpágina)
 */
export const createPage = async (req, res) => {
    try {
        const { title, system, tags, content, parentId } = req.body;

        // Se parentId for nulo, é uma Página Mestra (Publicação Principal)
        const newPage = await CommunityPage.create({
            title: title || 'Nova Publicação',
            system,
            tags: tags || [],
            content: (content && content.length > 0) ? content : [{
                id: crypto.randomUUID(),
                type: 'text',
                data: { text: "" }
            }],
            parentId: parentId || null
        });

        res.status(201).json({
            success: true,
            message: parentId ? 'Subpágina criada.' : 'Publicação principal criada.',
            data: newPage
        });
    } catch (error) {
        console.error('Erro ao criar página:', error);
        res.status(500).json({ error: 'Erro ao criar página.', details: error.message });
    }
};

/**
 * Listar Publicações (Apenas as páginas mestras para a vitrine da comunidade)
 */
export const getPublications = async (req, res) => {
    try {
        const { search, system, tag } = req.query;
        let whereClause = { parentId: null };

        if (search) {
            const searchLower = `%${search.toLowerCase()}%`;
            
            whereClause[Op.or] = [
                { title: { [Op.iLike]: searchLower } }, // Busca no título
                // BUSCA EM TAGS: Verifica se o array de tags contém o termo buscado
                { tags: { [Op.contains]: [search.toUpperCase()] } }, 
                // BUSCA NO CONTEÚDO (JSONB):
                sequelize.where(
                    sequelize.cast(sequelize.col('content'), 'text'),
                    { [Op.iLike]: searchLower }
                )
            ];
        }

        if (system) {
            whereClause.system = system;
        }
        
        // Se houver um filtro de tag específico vindo do select lateral
        if (tag) {
            whereClause.tags = { [Op.contains]: [tag] };
        }

        const publications = await CommunityPage.findAll({
            where: whereClause,
            attributes: ['id', 'title', 'system', 'tags', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        res.json({ success: true, total: publications.length, data: publications });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar publicações.' });
    }
};

export const getBreadcrumbs = async (req, res) => {
  const { id } = req.params;

  try {
    // Query Recursiva para buscar todos os pais
    const breadcrumbs = await sequelize.query(`
      WITH RECURSIVE path_tree AS (
        -- Base: começa pela página atual
        SELECT id, title, "parentId", 1 as level
        FROM "CommunityPages"
        WHERE id = :id

        UNION ALL

        -- Recursão: busca o pai da página encontrada no passo anterior
        SELECT p.id, p.title, p."parentId", pt.level + 1
        FROM "CommunityPages" p
        JOIN path_tree pt ON p.id = pt."parentId"
      )
      -- Retorna ordenado do mais antigo (raiz) para o mais novo (página atual)
      SELECT id, title FROM path_tree ORDER BY level DESC;
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    return res.json(breadcrumbs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar trilha de navegação' });
  }
};

/**
 * Buscar uma página específica e suas subpáginas imediatas (Navegação hierárquica)
 */
export const getPageDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const page = await CommunityPage.findByPk(id, {
            include: [{ model: CommunityPage, as: 'subPages', attributes: ['id', 'title'] }]
        });

        if (!page) return res.status(404).json({ error: 'Página não encontrada.' });

        // Mapeia os blocos de 'page' para garantir que o título venha do banco, não do JSON estático
        const updatedContent = await Promise.all(page.content.map(async (block) => {
            if (block.type === 'page' && block.data.pageId) {
                const subPage = await CommunityPage.findByPk(block.data.pageId, { attributes: ['title'] });
                return {
                    ...block,
                    data: { ...block.data, title: subPage ? subPage.title : block.data.title }
                };
            }
            return block;
        }));

        page.content = updatedContent;

        res.json({ success: true, data: page });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar detalhes.' });
    }
};

// communityController.js
export const getPageById = async (req, res) => {
    try {
        const page = await CommunityPage.findByPk(req.params.id, {
            include: [
                {
                    model: CommunityPage,
                    as: 'subpages', // Alias definido no Model
                    attributes: ['id', 'title'] // Apenas o básico para a sidebar
                }
            ]
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar página.' });
    }
};


/**
 * Atualizar conteúdo ou metadados
 */
export const updatePage = async (req, res) => {
    try {
        const { id } = req.params;
        const page = await CommunityPage.findByPk(id);

        if (!page) return res.status(404).json({ error: 'Página não encontrada.' });

        await page.update(req.body);
        
        res.json({
            success: true,
            data: page
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar página.' });
    }
};

/**
 * Deletar página e cascatear para os filhos (definido no Model com CASCADE)
 */
export const deletePage = async (req, res) => {
    try {
        const { id } = req.params;
        const page = await CommunityPage.findByPk(id);

        if (!page) return res.status(404).json({ error: 'Página não encontrada.' });

        await page.destroy();
        res.json({ success: true, message: 'Página e todas as suas subpáginas foram removidas.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao remover página.' });
    }
};